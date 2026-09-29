using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
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

        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36");
        }
    }

    public async Task<int> SyncIposAsync(CancellationToken cancellationToken = default)
    {
        int upsertedCount = 0;
        _logger.LogInformation("Starting real-time IPO and GMP synchronization...");

        // 1. Fetch Real-time Live GMP and IPO List from InvestorGain
        try
        {
            upsertedCount += await SyncFromInvestorGainAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "InvestorGain live sync encountered an error. Attempting secondary sources.");
        }

        // 2. Fetch Supplemental IPO details from Groww API if available
        try
        {
            upsertedCount += await SyncFromGrowwAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Groww API sync skipped or unavailable.");
        }

        return upsertedCount;
    }

    private async Task<int> SyncFromInvestorGainAsync(CancellationToken cancellationToken)
    {
        var url = "https://www.investorgain.com/report/live-ipo-gmp/331/";
        using var response = await _httpClient.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("InvestorGain returned status: {StatusCode}", response.StatusCode);
            return 0;
        }

        var html = await response.Content.ReadAsStringAsync(cancellationToken);
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        var rows = doc.DocumentNode.SelectNodes("//table//tbody//tr");
        if (rows == null || rows.Count == 0)
        {
            rows = doc.DocumentNode.SelectNodes("//table//tr");
        }

        if (rows == null) return 0;

        int count = 0;
        var currentYear = DateTime.UtcNow.Year;

        foreach (var row in rows)
        {
            var nameTd = row.SelectSingleNode(".//td[@data-label='Name']");
            if (nameTd == null) continue;

            var linkNode = nameTd.SelectSingleNode(".//a");
            var companyName = linkNode != null ? linkNode.InnerText.Trim() : nameTd.InnerText.Trim();
            if (string.IsNullOrWhiteSpace(companyName) || companyName.Length < 3) continue;

            // Normalize name
            companyName = CleanCompanyName(companyName);

            bool isSme = nameTd.InnerText.Contains("SME", StringComparison.OrdinalIgnoreCase);
            var category = isSme ? IpoCategory.Sme : IpoCategory.Mainboard;

            // GMP
            decimal gmp = 0m;
            var gmpTd = row.SelectSingleNode(".//td[@data-label='GMP']");
            if (gmpTd != null)
            {
                var gmpBold = gmpTd.SelectSingleNode(".//b");
                var gmpRaw = gmpBold != null ? gmpBold.InnerText.Trim() : gmpTd.InnerText.Trim();
                gmpRaw = gmpRaw.Replace("₹", "").Replace(",", "").Trim();
                if (decimal.TryParse(gmpRaw, out var parsedGmp))
                {
                    gmp = parsedGmp;
                }
            }

            // Price Band
            decimal? priceLow = null;
            decimal? priceHigh = null;
            var priceTd = row.SelectSingleNode(".//td[contains(@data-label,'Price')]");
            if (priceTd != null)
            {
                var priceText = priceTd.InnerText.Replace("₹", "").Replace(",", "").Trim();
                if (priceText.Contains("to", StringComparison.OrdinalIgnoreCase))
                {
                    var parts = priceText.Split(new[] { "to", "-" }, StringSplitOptions.RemoveEmptyEntries);
                    if (parts.Length >= 2 && decimal.TryParse(parts[0].Trim(), out var pL) && decimal.TryParse(parts[1].Trim(), out var pH))
                    {
                        priceLow = pL;
                        priceHigh = pH;
                    }
                }
                else if (decimal.TryParse(priceText, out var singleP))
                {
                    priceLow = singleP;
                    priceHigh = singleP;
                }
            }

            // Lot Size
            int lotSize = 1;
            var lotTd = row.SelectSingleNode(".//td[@data-label='Lot']");
            if (lotTd != null)
            {
                var lotText = lotTd.InnerText.Replace(",", "").Trim();
                if (int.TryParse(lotText, out var parsedLot))
                {
                    lotSize = parsedLot;
                }
            }

            // Subscription
            string subText = "{}";
            var subTd = row.SelectSingleNode(".//td[@data-label='Sub']");
            if (subTd != null)
            {
                var subValStr = subTd.InnerText.Replace("x", "").Replace("X", "").Trim();
                if (decimal.TryParse(subValStr, out var subVal))
                {
                    subText = $"{{\"overall\": {subVal.ToString(CultureInfo.InvariantCulture)}}}";
                }
            }

            // Dates
            DateOnly? openDate = ParseDate(row.SelectSingleNode(".//td[@data-label='Open']")?.InnerText, currentYear);
            DateOnly? closeDate = ParseDate(row.SelectSingleNode(".//td[@data-label='Close']")?.InnerText, currentYear);
            DateOnly? listingDate = ParseDate(row.SelectSingleNode(".//td[@data-label='Listing']")?.InnerText, currentYear);

            // Determine Status
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var status = IpoStatus.Upcoming;
            if (listingDate.HasValue && listingDate.Value <= today)
            {
                status = IpoStatus.Listed;
            }
            else if (closeDate.HasValue && closeDate.Value < today)
            {
                status = IpoStatus.Closed;
            }
            else if (openDate.HasValue && openDate.Value <= today && (!closeDate.HasValue || closeDate.Value >= today))
            {
                status = IpoStatus.Open;
            }

            // Match or create in database
            var ipo = await _context.Ipos
                .FirstOrDefaultAsync(i => i.CompanyName == companyName ||
                                         (companyName.Length > 8 && i.CompanyName.Contains(companyName)) ||
                                         (i.CompanyName.Length > 8 && companyName.Contains(i.CompanyName)), cancellationToken);

            if (ipo == null)
            {
                ipo = new Ipo
                {
                    Id = Guid.NewGuid(),
                    CompanyName = companyName,
                    Category = category,
                    Status = status,
                    IssuePriceLow = priceLow,
                    IssuePriceHigh = priceHigh,
                    LotSize = lotSize,
                    MinInvestment = priceHigh.HasValue ? priceHigh.Value * lotSize : null,
                    Gmp = gmp,
                    GmpUpdatedAt = DateTime.UtcNow,
                    OpenDate = openDate,
                    CloseDate = closeDate,
                    ListingDate = listingDate,
                    SubscriptionDataJson = subText,
                    Exchange = isSme ? "BSE/NSE SME" : "NSE/BSE"
                };
                _context.Ipos.Add(ipo);
            }
            else
            {
                ipo.Gmp = gmp;
                ipo.GmpUpdatedAt = DateTime.UtcNow;
                ipo.Status = status;
                ipo.Category = category;
                if (priceHigh.HasValue) ipo.IssuePriceHigh = priceHigh;
                if (priceLow.HasValue) ipo.IssuePriceLow = priceLow;
                if (lotSize > 1) ipo.LotSize = lotSize;
                if (ipo.IssuePriceHigh.HasValue && ipo.LotSize > 0)
                {
                    ipo.MinInvestment = ipo.IssuePriceHigh.Value * ipo.LotSize;
                }
                if (openDate.HasValue) ipo.OpenDate = openDate;
                if (closeDate.HasValue) ipo.CloseDate = closeDate;
                if (listingDate.HasValue) ipo.ListingDate = listingDate;
                if (subText != "{}") ipo.SubscriptionDataJson = subText;
                ipo.UpdatedAt = DateTime.UtcNow;
            }

            count++;
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("InvestorGain synchronized {Count} live IPO records successfully", count);
        return count;
    }

    private async Task<int> SyncFromGrowwAsync(CancellationToken cancellationToken)
    {
        var growwUrl = "https://groww.in/v1/api/stocks_data/v1/ipo/all";
        using var request = new HttpRequestMessage(HttpMethod.Get, growwUrl);
        request.Headers.Add("Accept", "application/json, text/plain, */*");
        request.Headers.Add("Referer", "https://groww.in/ipo");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode) return 0;

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var categories = new[]
        {
            ("activeIpoList", IpoStatus.Open),
            ("upcomingIpoList", IpoStatus.Upcoming),
            ("closedIpoList", IpoStatus.Closed),
            ("listedIpoList", IpoStatus.Listed)
        };

        int count = 0;
        foreach (var (listKey, status) in categories)
        {
            if (!root.TryGetProperty(listKey, out var listElem) || listElem.ValueKind != JsonValueKind.Array)
                continue;

            foreach (var item in listElem.EnumerateArray())
            {
                var companyName = item.TryGetProperty("companyName", out var cn) ? cn.GetString()?.Trim() : null;
                if (string.IsNullOrWhiteSpace(companyName)) continue;

                companyName = CleanCompanyName(companyName);
                var symbol = item.TryGetProperty("symbol", out var sym) ? sym.GetString() : null;
                var isSme = item.TryGetProperty("isSme", out var sme) && sme.GetBoolean();
                var category = isSme ? IpoCategory.Sme : IpoCategory.Mainboard;

                var ipo = await _context.Ipos.FirstOrDefaultAsync(i => i.CompanyName == companyName, cancellationToken);
                if (ipo == null)
                {
                    ipo = new Ipo
                    {
                        Id = Guid.NewGuid(),
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

                if (item.TryGetProperty("minPrice", out var minP) && minP.TryGetDecimal(out var minVal)) ipo.IssuePriceLow = minVal;
                if (item.TryGetProperty("maxPrice", out var maxP) && maxP.TryGetDecimal(out var maxVal)) ipo.IssuePriceHigh = maxVal;
                if (item.TryGetProperty("lotSize", out var ls) && ls.TryGetInt32(out var lotVal)) ipo.LotSize = lotVal;

                if (ipo.IssuePriceHigh.HasValue && ipo.LotSize > 0)
                {
                    ipo.MinInvestment = ipo.IssuePriceHigh.Value * ipo.LotSize;
                }

                if (item.TryGetProperty("biddingStartDate", out var bsd) && DateTime.TryParse(bsd.GetString(), out var openDt))
                    ipo.OpenDate = DateOnly.FromDateTime(openDt);
                if (item.TryGetProperty("biddingEndDate", out var bed) && DateTime.TryParse(bed.GetString(), out var closeDt))
                    ipo.CloseDate = DateOnly.FromDateTime(closeDt);
                if (item.TryGetProperty("allotmentDate", out var ald) && DateTime.TryParse(ald.GetString(), out var allotDt))
                    ipo.AllotmentDate = DateOnly.FromDateTime(allotDt);
                if (item.TryGetProperty("listingDate", out var lsd) && DateTime.TryParse(lsd.GetString(), out var listDt))
                    ipo.ListingDate = DateOnly.FromDateTime(listDt);

                ipo.UpdatedAt = DateTime.UtcNow;
                count++;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return count;
    }

    private static string CleanCompanyName(string raw)
    {
        // Strip out noise like "IPO", "NSE SME", etc.
        var cleaned = Regex.Replace(raw, @"\s+(IPO|SME|NSE|BSE)\b.*$", "", RegexOptions.IgnoreCase).Trim();
        return string.IsNullOrWhiteSpace(cleaned) ? raw.Trim() : cleaned;
    }

    private static DateOnly? ParseDate(string? text, int currentYear)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;

        // Common formats: "18-Sep", "18-Sep-2026", "18 Sep", "18/09/2026"
        var clean = text.Split(new[] { '<', '\n', '\r' })[0].Trim();
        if (DateTime.TryParse(clean, out var dt))
        {
            return DateOnly.FromDateTime(dt);
        }

        // Try format "dd-MMM" (e.g. "18-Sep")
        if (DateTime.TryParseExact($"{clean}-{currentYear}", "d-MMM-yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dtCustom))
        {
            return DateOnly.FromDateTime(dtCustom);
        }

        return null;
    }
}
