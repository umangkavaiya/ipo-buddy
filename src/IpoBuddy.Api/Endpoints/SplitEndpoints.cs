using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using IpoBuddy.Application.Common;
using IpoBuddy.Application.DTOs;
using IpoBuddy.Application.Interfaces;
using IpoBuddy.Domain.Entities;

namespace IpoBuddy.Api.Endpoints;

public static class SplitEndpoints
{
    public static RouteGroupBuilder MapSplitEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/groups/{id:guid}/splits", async (
            Guid id,
            CreateSplitDto dto,
            ClaimsPrincipal principal,
            IAppDbContext db) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                return Results.Unauthorized();

            if (dto.TotalAmount <= 0)
                return Results.BadRequest(new { status = "error", message = "Total amount must be greater than zero" });

            var g = await db.Groups
                .Include(grp => grp.Members).ThenInclude(m => m.User)
                .FirstOrDefaultAsync(grp => grp.Id == id && grp.IsActive);

            if (g == null) return Results.NotFound("Group not found");

            if (!g.Members.Any(m => m.UserId == userId))
                return Results.Forbid();

            var members = g.Members.ToList();
            if (members.Count == 0)
                return Results.BadRequest("Group has no members");

            // Divide equally without penny drift using SplitCalculator
            var shares = SplitCalculator.DivideEqually(dto.TotalAmount, members.Count);

            var split = new Split
            {
                GroupId = g.Id,
                CreatedById = userId,
                Description = dto.Description.Trim(),
                TotalAmount = dto.TotalAmount,
                SplitType = SplitType.Equal,
                Status = SplitStatus.Pending
            };
            db.Splits.Add(split);

            var entryDtos = new List<SplitEntryDto>();
            for (int i = 0; i < members.Count; i++)
            {
                var member = members[i];
                bool isCreator = (member.UserId == userId);
                var entry = new SplitEntry
                {
                    Split = split,
                    UserId = member.UserId,
                    Amount = shares[i],
                    IsSettled = isCreator,
                    SettledAt = isCreator ? DateTime.UtcNow : null
                };
                db.SplitEntries.Add(entry);

                entryDtos.Add(new SplitEntryDto(
                    entry.Id,
                    member.UserId,
                    member.User.DisplayName,
                    entry.Amount,
                    entry.IsSettled,
                    entry.SettledAt
                ));
            }

            split.UpdateSettledStatus();
            await db.SaveChangesAsync();

            var creator = members.First(m => m.UserId == userId).User;

            return Results.Ok(new SplitDto(
                split.Id,
                split.GroupId,
                split.Description,
                split.TotalAmount,
                split.Status.ToString(),
                creator.DisplayName,
                split.CreatedAt,
                entryDtos
            ));
        }).RequireAuthorization().WithSummary("Create a new split in a group");

        group.MapGet("/groups/{id:guid}/splits", async (
            Guid id,
            ClaimsPrincipal principal,
            IAppDbContext db) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                return Results.Unauthorized();

            var isMember = await db.GroupMembers.AnyAsync(m => m.GroupId == id && m.UserId == userId);
            if (!isMember) return Results.Forbid();

            var splits = await db.Splits
                .Where(s => s.GroupId == id)
                .Include(s => s.CreatedBy)
                .Include(s => s.Entries).ThenInclude(e => e.User)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new SplitDto(
                    s.Id,
                    s.GroupId,
                    s.Description,
                    s.TotalAmount,
                    s.Status.ToString(),
                    s.CreatedBy.DisplayName,
                    s.CreatedAt,
                    s.Entries.Select(e => new SplitEntryDto(
                        e.Id,
                        e.UserId,
                        e.User.DisplayName,
                        e.Amount,
                        e.IsSettled,
                        e.SettledAt
                    )).ToList()
                ))
                .ToListAsync();

            return Results.Ok(splits);
        }).RequireAuthorization().WithSummary("List all splits for a group");

        group.MapPost("/splits/{splitId:guid}/settle/{entryId:guid}", async (
            Guid splitId,
            Guid entryId,
            ClaimsPrincipal principal,
            IAppDbContext db) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                return Results.Unauthorized();

            var split = await db.Splits
                .Include(s => s.Entries)
                .FirstOrDefaultAsync(s => s.Id == splitId);

            if (split == null) return Results.NotFound("Split not found");

            var entry = split.Entries.FirstOrDefault(e => e.Id == entryId);
            if (entry == null) return Results.NotFound("Entry not found");

            // Only the split creator or the entry user can settle
            if (userId != split.CreatedById && userId != entry.UserId)
            {
                return Results.Forbid();
            }

            entry.IsSettled = !entry.IsSettled;
            entry.SettledAt = entry.IsSettled ? DateTime.UtcNow : null;

            split.UpdateSettledStatus();
            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                status = "success",
                entryId = entry.Id,
                isSettled = entry.IsSettled,
                splitStatus = split.Status.ToString()
            });
        }).RequireAuthorization().WithSummary("Toggle settlement status for an individual split entry");

        group.MapGet("/splits/balances", async (ClaimsPrincipal principal, IAppDbContext db) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                return Results.Unauthorized();

            var balances = new Dictionary<Guid, (string DisplayName, decimal NetAmount)>();

            // 1. Amounts owed to current user (User created split, others unsettled)
            var createdSplits = await db.Splits
                .Where(s => s.CreatedById == userId)
                .Include(s => s.Entries).ThenInclude(e => e.User)
                .ToListAsync();

            foreach (var s in createdSplits)
            {
                foreach (var e in s.Entries.Where(e => !e.IsSettled && e.UserId != userId))
                {
                    var other = e.User;
                    if (!balances.ContainsKey(other.Id))
                        balances[other.Id] = (other.DisplayName, 0m);

                    var current = balances[other.Id];
                    balances[other.Id] = (current.DisplayName, current.NetAmount + e.Amount);
                }
            }

            // 2. Amounts current user owes to others
            var myUnsettled = await db.SplitEntries
                .Where(e => e.UserId == userId && !e.IsSettled && e.Split.CreatedById != userId)
                .Include(e => e.Split).ThenInclude(s => s.CreatedBy)
                .ToListAsync();

            foreach (var e in myUnsettled)
            {
                var creator = e.Split.CreatedBy;
                if (!balances.ContainsKey(creator.Id))
                    balances[creator.Id] = (creator.DisplayName, 0m);

                var current = balances[creator.Id];
                balances[creator.Id] = (current.DisplayName, current.NetAmount - e.Amount);
            }

            var result = balances.Select(b => new NetBalanceDto(b.Key, b.Value.DisplayName, b.Value.NetAmount)).ToList();
            return Results.Ok(result);
        }).RequireAuthorization().WithSummary("Aggregate net balances across all groups for user");

        return group;
    }
}
