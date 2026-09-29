using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using IpoBuddy.Application.DTOs;
using IpoBuddy.Application.Interfaces;
using IpoBuddy.Domain.Entities;

namespace IpoBuddy.Api.Endpoints;

public static class GroupEndpoints
{
    public static RouteGroupBuilder MapGroupEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/groups", async (
            CreateGroupDto dto,
            ClaimsPrincipal principal,
            IAppDbContext db) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                return Results.Unauthorized();

            string name = dto.Name?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(name))
                return Results.BadRequest(new { status = "error", message = "Group name is required" });

            // Generate unique 6-character code
            string code;
            do
            {
                code = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
            } while (await db.Groups.AnyAsync(g => g.InviteCode == code));

            var newGroup = new Group
            {
                Name = name,
                InviteCode = code,
                CreatedById = userId
            };
            db.Groups.Add(newGroup);

            db.GroupMembers.Add(new GroupMember
            {
                GroupId = newGroup.Id,
                UserId = userId,
                Role = GroupRole.Admin
            });

            await db.SaveChangesAsync();

            return Results.Ok(new GroupDto(
                newGroup.Id,
                newGroup.Name,
                newGroup.InviteCode,
                newGroup.MaxMembers,
                1,
                newGroup.CreatedAt
            ));
        }).RequireAuthorization().WithSummary("Create a new private group with invite code");

        group.MapGet("/groups", async (ClaimsPrincipal principal, IAppDbContext db) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                return Results.Unauthorized();

            var groups = await db.GroupMembers
                .Where(m => m.UserId == userId && m.Group.IsActive)
                .Select(m => new GroupDto(
                    m.Group.Id,
                    m.Group.Name,
                    m.Group.InviteCode,
                    m.Group.MaxMembers,
                    m.Group.Members.Count,
                    m.Group.CreatedAt
                ))
                .ToListAsync();

            return Results.Ok(groups);
        }).RequireAuthorization().WithSummary("List all private groups for current user");

        group.MapGet("/groups/{id:guid}", async (Guid id, ClaimsPrincipal principal, IAppDbContext db) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                return Results.Unauthorized();

            var g = await db.Groups
                .Include(grp => grp.Members).ThenInclude(m => m.User)
                .Include(grp => grp.GroupWatchlists)
                .FirstOrDefaultAsync(grp => grp.Id == id && grp.IsActive);

            if (g == null) return Results.NotFound();

            if (!g.Members.Any(m => m.UserId == userId))
            {
                return Results.Forbid();
            }

            var members = g.Members.Select(m => new GroupMemberDto(
                m.UserId,
                m.User.DisplayName,
                !string.IsNullOrEmpty(m.User.Phone) && m.User.Phone.Length >= 4 ? $"****{m.User.Phone[^4..]}" : m.User.Phone,
                m.User.Email,
                m.Role.ToString()
            )).ToList();

            var watchlistIpoIds = g.GroupWatchlists.Select(gw => gw.IpoId).ToList();

            return Results.Ok(new GroupDetailDto(
                g.Id,
                g.Name,
                g.InviteCode,
                g.MaxMembers,
                members,
                watchlistIpoIds
            ));
        }).RequireAuthorization().WithSummary("Get group details, members, and watchlist");

        group.MapPost("/groups/join", async (
            JoinGroupDto dto,
            ClaimsPrincipal principal,
            IAppDbContext db) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                return Results.Unauthorized();

            string code = dto.InviteCode?.Trim().ToUpperInvariant() ?? string.Empty;
            var g = await db.Groups
                .Include(grp => grp.Members)
                .FirstOrDefaultAsync(grp => grp.InviteCode == code && grp.IsActive);

            if (g == null)
            {
                return Results.NotFound(new { status = "error", message = "Invalid invite code" });
            }

            if (g.Members.Any(m => m.UserId == userId))
            {
                return Results.BadRequest(new { status = "error", message = "You are already a member of this group" });
            }

            if (g.Members.Count >= g.MaxMembers)
            {
                return Results.BadRequest(new { status = "error", message = "Group has reached maximum member capacity" });
            }

            db.GroupMembers.Add(new GroupMember
            {
                GroupId = g.Id,
                UserId = userId,
                Role = GroupRole.Member
            });

            await db.SaveChangesAsync();

            return Results.Ok(new GroupDto(
                g.Id,
                g.Name,
                g.InviteCode,
                g.MaxMembers,
                g.Members.Count,
                g.CreatedAt
            ));
        }).RequireAuthorization().WithSummary("Join a group using invite code");

        group.MapPost("/groups/{id:guid}/watchlist/{ipoId:guid}", async (
            Guid id,
            Guid ipoId,
            ClaimsPrincipal principal,
            IAppDbContext db) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                return Results.Unauthorized();

            var isMember = await db.GroupMembers.AnyAsync(m => m.GroupId == id && m.UserId == userId);
            if (!isMember) return Results.Forbid();

            var ipoExists = await db.Ipos.AnyAsync(i => i.Id == ipoId);
            if (!ipoExists) return Results.NotFound("IPO not found");

            var item = await db.GroupWatchlists.FirstOrDefaultAsync(gw => gw.GroupId == id && gw.IpoId == ipoId);
            if (item == null)
            {
                db.GroupWatchlists.Add(new GroupWatchlist
                {
                    GroupId = id,
                    IpoId = ipoId,
                    AddedById = userId
                });
                await db.SaveChangesAsync();
            }

            return Results.Ok(new { status = "success", message = "Added to group watchlist" });
        }).RequireAuthorization().WithSummary("Add an IPO to shared group watchlist");

        return group;
    }
}
