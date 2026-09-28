using System.Text.Json;
using HtmlAgilityPack;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using IpoBuddy.Application.Interfaces;
using IpoBuddy.Domain.Entities;

namespace IpoBuddy.Infrastructure.Services;

public interface IIpoSyncService
{
    Task<int> SyncIposAsync(CancellationToken cancellationToken = default);
}

public class IpoSyncService : IIpoSyncService
{
    private readonly IAppDbContext _context;
    private readonly HttpClient _httpClient;
    private readonly ILogger<IpoSyncService> _logger;

    public IpoSyncService(IAppDbContext context, HttpClient httpClient, ILogger<IpoSyncService> logger)
    {
        _context = context;
        _httpClient = httpClient;
        _logger = logger;
        
        // Add browser User-Agent
        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        }
    }

    public async Task<int> SyncIposAsync(CancellationToken cancellationToken = default)
    {
        int upsertedCount = 0;
        _logger.LogInformation("Starting IPO synchronization...");

        // 1. Fetch from Groww public web API
        try
        {
            var growwUrl = "https://groww.in/v1/api/stocks_data/v1/ipo/all";
            using var response = await _httpClient.GetAsync(growwUrl, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                // Process upcoming, active, closed, and listed
                var categories = new[]
                {
                    ("activeIpoList", IpoStatus.Open),
                    ("upcomingIpoList", IpoStatus.Upcoming),
                    ("closedIpoList", IpoStatus.Closed),
                    ("listedIpoList", IpoStatus.Listed)
                };

                foreach (var (listKey, status) in categories)
                {
                    if (!root.TryGetProperty(listKey, out var listElem) || listElem.ValueKind != JsonValueKind.Array)
                        continue;

                    foreach (var item in listElem.EnumerateArray())
                    {
                        var companyName = item.TryGetProperty("companyName", out var cn) ? cn.GetString()?.Trim() : null;
                        if (string.IsNullOrWhiteSpace(companyName)) continue;

                        var symbol = item.TryGetProperty("symbol", out var sym) ? sym.GetString() : null;
                        var isSme = item.TryGetProperty("isSme", out var sme) && sme.GetBoolean();
                        var category = isSme ? IpoCategory.Sme : IpoCategory.Mainboard;

                        var ipo = await _context.Ipos.FirstOrDefaultAsync(i => i.CompanyName == companyName, cancellationToken);
                        if (ipo == null)
                        {
                            ipo = new Ipo
                            {
                                CompanyName = companyName,
                                Symbol = symbol,
                                Category = category,
                                Status = status
                            };
                            _context.Ipos.Add(ipo);
                        }
                        else
                        {
                            ipo.Status = status;
                            ipo.Category = category;
                            if (!string.IsNullOrEmpty(symbol)) ipo.Symbol = symbol;
                        }

                        // Price and Lot Size
                        if (item.TryGetProperty("minPrice", out var minP) && minP.TryGetDecimal(out var minVal)) ipo.IssuePriceLow = minVal;
                        if (item.TryGetProperty("maxPrice", out var maxP) && maxP.TryGetDecimal(out var maxVal)) ipo.IssuePriceHigh = maxVal;
                        if (item.TryGetProperty("lotSize", out var ls) && ls.TryGetInt32(out var lotVal)) ipo.LotSize = lotVal;

                        if (ipo.IssuePriceHigh.HasValue && ipo.LotSize > 0)
                        {
                            ipo.MinInvestment = ipo.IssuePriceHigh.Value * ipo.LotSize;
                        }

                        // Dates
                        if (item.TryGetProperty("biddingStartDate", out var bsd) && DateTime.TryParse(bsd.GetString(), out var openDt))
                            ipo.OpenDate = DateOnly.FromDateTime(openDt);
                        if (item.TryGetProperty("biddingEndDate", out var bed) && DateTime.TryParse(bed.GetString(), out var closeDt))
                            ipo.CloseDate = DateOnly.FromDateTime(closeDt);
                        if (item.TryGetProperty("allotmentDate", out var ald) && DateTime.TryParse(ald.GetString(), out var allotDt))
                            ipo.AllotmentDate = DateOnly.FromDateTime(allotDt);
                        if (item.TryGetProperty("listingDate", out var lsd) && DateTime.TryParse(lsd.GetString(), out var listDt))
                            ipo.ListingDate = DateOnly.FromDateTime(listDt);

                        ipo.UpdatedAt = DateTime.UtcNow;
                        upsertedCount++;
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Successfully ingested {Count} IPOs from Groww", upsertedCount);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not fetch from Groww API. Proceeding with existing records.");
        }

        // 2. Fetch GMP from InvestorGain
        try
        {
            var gmpUrl = "https://www.investorgain.com/gmp/ipo-gmp-today/";
            using var gmpResp = await _httpClient.GetAsync(gmpUrl, cancellationToken);
            if (gmpResp.IsSuccessStatusCode)
            {
                var html = await gmpResp.Content.ReadAsStringAsync(cancellationToken);
                var htmlDoc = new HtmlDocument();
                htmlDoc.LoadHtml(html);

                var rows = htmlDoc.DocumentNode.SelectNodes("//table//tr");
                if (rows != null)
                {
                    foreach (var row in rows)
                    {
                        var cells = row.SelectNodes("td");
                        if (cells == null || cells.Count < 3) continue;

                        var name = cells[0].InnerText.Trim();
                        var gmpText = cells[2].InnerText.Trim().Replace("₹", "").Replace(",", "").Trim();

                        if (decimal.TryParse(gmpText, out var gmpValue))
                        {
                            // Match with existing IPO in database (fuzzy name match)
                            var matchedIpo = await _context.Ipos
                                .FirstOrDefaultAsync(i => i.CompanyName.ToLower().Contains(name.ToLower()) || name.ToLower().Contains(i.CompanyName.ToLower()), cancellationToken);

                            if (matchedIpo != null)
                            {
                                matchedIpo.Gmp = gmpValue;
                                matchedIpo.GmpUpdatedAt = DateTime.UtcNow;
                            }
                        }
                    }
                    await _context.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("Successfully updated GMP premiums from InvestorGain");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not fetch InvestorGain GMP table. Skipped GMP refresh.");
        }

        return upsertedCount;
    }
}
