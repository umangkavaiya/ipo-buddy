using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using IpoBuddy.Application.DTOs;
using IpoBuddy.Application.Interfaces;
using IpoBuddy.Domain.Entities;
using IpoBuddy.Infrastructure.Services;

namespace IpoBuddy.Api.Endpoints;

public static class IpoEndpoints
{
    public static RouteGroupBuilder MapIpoEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/ipos", async (
            string? status,
            string? category,
            string? search,
            IAppDbContext db) =>
        {
            var query = db.Ipos.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<IpoStatus>(status, true, out var parsedStatus))
            {
                query = query.FilterByStatus(parsedStatus);
            }

            if (!string.IsNullOrWhiteSpace(category) && Enum.TryParse<IpoCategory>(category, true, out var parsedCategory))
            {
                query = query.Where(i => i.Category == parsedCategory);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                string term = search.Trim().ToLower();
                query = query.Where(i => i.CompanyName.ToLower().Contains(term) || (i.Symbol != null && i.Symbol.ToLower().Contains(term)));
            }

            var list = await query
                .OrderByDescending(i => i.OpenDate)
                .ThenBy(i => i.CompanyName)
                .Select(i => ToDto(i))
                .ToListAsync();

            return Results.Ok(list);
        }).WithSummary("List all IPOs with status/category/search filters");

        group.MapGet("/ipos/{id:guid}", async (Guid id, IAppDbContext db) =>
        {
            var ipo = await db.Ipos.AsNoTracking().FirstOrDefaultAsync(i => i.Id == id);
            return ipo != null ? Results.Ok(ToDto(ipo)) : Results.NotFound();
        }).WithSummary("Get detailed information for an IPO");

        group.MapGet("/watchlist", async (ClaimsPrincipal principal, IAppDbContext db) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                return Results.Unauthorized();

            var list = await db.WatchlistItems
                .Where(w => w.UserId == userId)
                .Include(w => w.Ipo)
                .Select(w => ToDto(w.Ipo))
                .ToListAsync();

            return Results.Ok(list);
        }).RequireAuthorization().WithSummary("Get authenticated user's watchlist");

        group.MapPost("/watchlist/{ipoId:guid}", async (Guid ipoId, ClaimsPrincipal principal, IAppDbContext db) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                return Results.Unauthorized();

            var exists = await db.Ipos.AnyAsync(i => i.Id == ipoId);
            if (!exists) return Results.NotFound("IPO not found");

            var item = await db.WatchlistItems.FirstOrDefaultAsync(w => w.UserId == userId && w.IpoId == ipoId);
            if (item == null)
            {
                db.WatchlistItems.Add(new WatchlistItem { UserId = userId, IpoId = ipoId });
                await db.SaveChangesAsync();
            }

            return Results.Ok(new { status = "success", message = "Added to watchlist" });
        }).RequireAuthorization().WithSummary("Add an IPO to watchlist");

        group.MapDelete("/watchlist/{ipoId:guid}", async (Guid ipoId, ClaimsPrincipal principal, IAppDbContext db) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                return Results.Unauthorized();

            var item = await db.WatchlistItems.FirstOrDefaultAsync(w => w.UserId == userId && w.IpoId == ipoId);
            if (item != null)
            {
                db.WatchlistItems.Remove(item);
                await db.SaveChangesAsync();
            }

            return Results.Ok(new { status = "success", message = "Removed from watchlist" });
        }).RequireAuthorization().WithSummary("Remove an IPO from watchlist");

        group.MapPost("/admin/sync-ipos", async (IIpoSyncService syncService) =>
        {
            int count = await syncService.SyncIposAsync();
            return Results.Ok(new { status = "success", message = $"Ingested/updated {count} IPO records from public feeds" });
        }).WithSummary("Trigger on-demand background sync from Groww & InvestorGain");

        return group;
    }

    private static IQueryable<Ipo> FilterByStatus(this IQueryable<Ipo> query, IpoStatus status)
    {
        return query.Where(i => i.Status == status);
    }

    private static IpoDto ToDto(Ipo i) => new(
        i.Id,
        i.CompanyName,
        i.Symbol,
        i.Exchange,
        i.Category.ToString(),
        i.Status.ToString(),
        i.IssuePriceLow,
        i.IssuePriceHigh,
        i.LotSize,
        i.MinInvestment,
        i.OpenDate,
        i.CloseDate,
        i.AllotmentDate,
        i.ListingDate,
        i.ListingPrice,
        i.ListingGainPct,
        i.Gmp,
        i.SubscriptionDataJson,
        i.RegistrarName,
        i.RegistrarUrl
    );
}
