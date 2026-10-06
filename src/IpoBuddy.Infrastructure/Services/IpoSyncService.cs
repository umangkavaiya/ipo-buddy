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

    private static readonly Dictionary<string, string> KnownRegistrarUrls = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Link Intime"] = "https://linkintime.co.in/initial_offer/public-issues.html",
        ["MUFG Intime"] = "https://linkintime.co.in/initial_offer/public-issues.html",
        ["KFin Technologies"] = "https://kosmic.kfintech.com/ipostatus",
        ["KFintech"] = "https://kosmic.kfintech.com/ipostatus",
        ["Karvy"] = "https://kosmic.kfintech.com/ipostatus",
        ["Bigshare Services"] = "https://ipo.bigshareonline.com/ipo_status.html",
        ["Skyline Financial"] = "https://www.skylinerta.com/ipo.php",
        ["Cameo Corporate"] = "https://ipo.cameoindia.com/",
        ["Purva Sharegistry"] = "https://www.purvashare.com/queries/",
        ["Maashitla Securities"] = "https://maashitla.com/allotment-status/public-issues",
        ["Integrated Registry"] = "https://www.integratedindia.in/",
        ["Beetal Financial"] = "http://www.beetalfinancial.com/",
        ["Alankit Assignments"] = "https://www.alankit.com/",
        ["Mas Services"] = "https://www.masserv.com/",
        ["Datamatics"] = "https://www.datamatics.com/",
        ["Satellite Corporate"] = "https://www.satellitecorporate.com/"
    };

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
        _logger.LogInformation("Starting real-time IPO and GMP synchronization...");

        // 1. Primary Source: High-Accuracy Multi-Feed Sync from IPO Ji (https://www.ipoji.com/)
        try
        {
            int count = await SyncFromIpoJiAsync(cancellationToken);
            if (count > 0)
            {
                _logger.LogInformation("IPO Ji synchronized {Count} high-accuracy IPO records successfully.", count);
                return count;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "IPO Ji sync encountered an error. Falling back to secondary sources.");
        }

        int fallbackCount = 0;

        // 2. Fallback: InvestorGain
        try
        {
            fallbackCount += await SyncFromInvestorGainAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "InvestorGain live sync encountered an error.");
        }

        // 3. Fallback: Groww API
        try
        {
            fallbackCount += await SyncFromGrowwAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Groww API sync skipped or unavailable.");
        }

        return fallbackCount;
    }

    private async Task<int> SyncFromIpoJiAsync(CancellationToken cancellationToken)
    {
        // Step A: Fetch comprehensive master IPO list
        var listUrl = "https://www.ipoji.com/ipo-list";
        using var listResp = await _httpClient.GetAsync(listUrl, cancellationToken);
        if (!listResp.IsSuccessStatusCode)
        {
            _logger.LogWarning("IPO Ji ipo-list returned status: {StatusCode}", listResp.StatusCode);
            return 0;
        }

        var listHtml = await listResp.Content.ReadAsStringAsync(cancellationToken);
        var doc = new HtmlDocument();
        doc.LoadHtml(listHtml);

        var rows = doc.DocumentNode.SelectNodes("//tr[contains(@class, 'ipo-row')]");
        if (rows == null || rows.Count == 0)
        {
            _logger.LogWarning("No ipo-row elements found in IPO Ji page.");
            return 0;
        }

        // Load existing database IPOs for fast lookups & merge
        var existingIpos = await _context.Ipos.ToListAsync(cancellationToken);
        var ipoDict = new Dictionary<string, Ipo>(StringComparer.OrdinalIgnoreCase);
        var detailSlugMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var ipo in existingIpos)
        {
            var key = NormalizeKey(ipo.CompanyName);
            if (!string.IsNullOrEmpty(key) && !ipoDict.ContainsKey(key))
            {
                ipoDict[key] = ipo;
            }
        }

        int processedCount = 0;
        var detailFetchCandidates = new List<(Ipo Ipo, string SlugUrl)>();

        foreach (var row in rows)
        {
            var nameNode = row.SelectSingleNode(".//div[contains(@class, 'company-name')]") ??
                           row.SelectSingleNode(".//div[@class='company-info']//a");
            var rawName = nameNode?.InnerText?.Trim() ?? "";
            var companyName = CleanDisplayName(rawName);
            if (string.IsNullOrWhiteSpace(companyName) || companyName.Length < 2) continue;

            // Extract detail URL
            var onclick = row.GetAttributeValue("onclick", "");
            var slugMatch = Regex.Match(onclick, @"'(/ipo/[^']+)'");
            var slugUrl = slugMatch.Success ? slugMatch.Groups[1].Value :
                          (row.SelectSingleNode(".//a")?.GetAttributeValue("href", "") ?? "");

            var typeVal = row.GetAttributeValue("data-ipo-type", "");
            var isSme = typeVal == "1" || row.InnerText.Contains("SME", StringComparison.OrdinalIgnoreCase);
            var category = isSme ? IpoCategory.Sme : IpoCategory.Mainboard;

            var tds = row.SelectNodes(".//td");
            if (tds == null || tds.Count < 6) continue;

            DateOnly? openDate = ParseSortValueOrDate(tds[1].GetAttributeValue("data-sort-value", ""), tds[1].InnerText);
            DateOnly? closeDate = ParseSortValueOrDate(tds[2].GetAttributeValue("data-sort-value", ""), tds[2].InnerText);
            DateOnly? listingDate = ParseSortValueOrDate(tds[3].GetAttributeValue("data-sort-value", ""), tds[3].InnerText);

            var priceNode = tds[4].SelectSingleNode(".//div[contains(@class, 'price-cell')]") ?? tds[4];
            var (priceLow, priceHigh) = ParsePriceBand(priceNode.InnerText);

            var lotNode = tds[5].SelectSingleNode(".//div[contains(@class, 'date-cell')]") ?? tds[5];
            var lotSize = ParseLotSize(lotNode.InnerText);

            var badgesNode = row.SelectSingleNode(".//div[contains(@class, 'company-badges')]");
            var exchange = ParseExchange(badgesNode?.InnerText, isSme);

            var status = CalculateStatus(openDate, closeDate, listingDate, null);

            var normKey = NormalizeKey(companyName);
            if (!ipoDict.TryGetValue(normKey, out var ipo))
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
                    OpenDate = openDate,
                    CloseDate = closeDate,
                    ListingDate = listingDate,
                    Exchange = exchange,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Ipos.Add(ipo);
                ipoDict[normKey] = ipo;
            }
            else
            {
                ipo.Category = category;
                ipo.Status = status;
                if (priceLow.HasValue) ipo.IssuePriceLow = priceLow;
                if (priceHigh.HasValue) ipo.IssuePriceHigh = priceHigh;
                if (lotSize > 1) ipo.LotSize = lotSize;
                if (ipo.IssuePriceHigh.HasValue && ipo.LotSize > 0)
                {
                    ipo.MinInvestment = ipo.IssuePriceHigh.Value * ipo.LotSize;
                }
                if (openDate.HasValue) ipo.OpenDate = openDate;
                if (closeDate.HasValue) ipo.CloseDate = closeDate;
                if (listingDate.HasValue) ipo.ListingDate = listingDate;
                if (!string.IsNullOrEmpty(exchange)) ipo.Exchange = exchange;
                ipo.UpdatedAt = DateTime.UtcNow;
            }

            if (!string.IsNullOrWhiteSpace(slugUrl))
            {
                detailSlugMap[normKey] = slugUrl;
                if (ipo.Status == IpoStatus.Open || ipo.Status == IpoStatus.Upcoming || ipo.Status == IpoStatus.Closed)
                {
                    detailFetchCandidates.Add((ipo, slugUrl));
                }
            }

            processedCount++;
        }

        // Step B: Overlay Live GMP from IPO Ji GMP Table
        try
        {
            await IngestGmpFeedAsync(ipoDict, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to overlay live GMP table from IPO Ji.");
        }

        // Step C: Overlay Live Subscription Data
        try
        {
            await IngestSubscriptionFeedAsync(ipoDict, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to overlay live subscription table from IPO Ji.");
        }

        // Step D: Enrich active / upcoming IPOs with exact Allotment Date & Registrar from detail pages
        try
        {
            var topCandidates = detailFetchCandidates
                .OrderBy(c => c.Ipo.Status == IpoStatus.Open ? 0 : c.Ipo.Status == IpoStatus.Upcoming ? 1 : 2)
                .Take(25)
                .ToList();

            await EnrichDetailPagesAsync(topCandidates, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Detail page enrichment encountered an issue.");
        }

        await _context.SaveChangesAsync(cancellationToken);
        return processedCount;
    }

    private async Task IngestGmpFeedAsync(Dictionary<string, Ipo> ipoDict, CancellationToken cancellationToken)
    {
        var gmpUrl = "https://www.ipoji.com/ipo-gmp";
        using var gmpResp = await _httpClient.GetAsync(gmpUrl, cancellationToken);
        if (!gmpResp.IsSuccessStatusCode) return;

        var gmpHtml = await gmpResp.Content.ReadAsStringAsync(cancellationToken);
        var gmpDoc = new HtmlDocument();
        gmpDoc.LoadHtml(gmpHtml);

        var gmpRows = gmpDoc.DocumentNode.SelectNodes("//table[@id='gmpTable']//tr[contains(@class, 'gmp-row')]");
        if (gmpRows == null) return;

        foreach (var row in gmpRows)
        {
            var name = row.GetAttributeValue("data-name", "");
            if (string.IsNullOrWhiteSpace(name))
            {
                name = row.SelectSingleNode(".//a[contains(@class, 'gmp-ipo-link')]")?.InnerText?.Trim() ?? "";
            }
            if (string.IsNullOrWhiteSpace(name)) continue;

            var cleanName = CleanDisplayName(name);
            var key = NormalizeKey(cleanName);

            // Parse GMP
            decimal gmp = 0m;
            var gmpValStr = row.GetAttributeValue("data-gmp", "");
            if (decimal.TryParse(gmpValStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedGmp))
            {
                gmp = parsedGmp;
            }

            // Parse status hint
            var statusStr = row.GetAttributeValue("data-status", "").ToLowerInvariant();
            IpoStatus? gmpStatus = statusStr switch
            {
                "open" => IpoStatus.Open,
                "closed" => IpoStatus.Closed,
                "upcoming" => IpoStatus.Upcoming,
                "listed" => IpoStatus.Listed,
                _ => null
            };

            // Parse Last Updated Time
            var timeNode = row.SelectSingleNode(".//time[contains(@class, 'gmp-updated-time')]");
            DateTime gmpUpdatedAt = DateTime.UtcNow;
            if (timeNode != null)
            {
                var dtStr = timeNode.GetAttributeValue("datetime", "");
                if (DateTime.TryParse(dtStr, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal, out var parsedDt))
                {
                    gmpUpdatedAt = parsedDt.ToUniversalTime();
                }
            }

            if (ipoDict.TryGetValue(key, out var ipo))
            {
                ipo.Gmp = gmp;
                ipo.GmpUpdatedAt = gmpUpdatedAt;
                if (gmpStatus.HasValue)
                {
                    ipo.Status = gmpStatus.Value;
                }
                ipo.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var isSme = row.GetAttributeValue("data-type", "").Contains("sme", StringComparison.OrdinalIgnoreCase);
                var category = isSme ? IpoCategory.Sme : IpoCategory.Mainboard;
                var priceTd = row.SelectSingleNode(".//td[contains(@data-label,'Price Band')]");
                var (pLow, pHigh) = ParsePriceBand(priceTd?.InnerText);

                var newIpo = new Ipo
                {
                    Id = Guid.NewGuid(),
                    CompanyName = cleanName,
                    Category = category,
                    Status = gmpStatus ?? IpoStatus.Upcoming,
                    IssuePriceLow = pLow,
                    IssuePriceHigh = pHigh,
                    Gmp = gmp,
                    GmpUpdatedAt = gmpUpdatedAt,
                    Exchange = isSme ? "BSE/NSE SME" : "NSE/BSE",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Ipos.Add(newIpo);
                ipoDict[key] = newIpo;
            }
        }
    }

    private async Task IngestSubscriptionFeedAsync(Dictionary<string, Ipo> ipoDict, CancellationToken cancellationToken)
    {
        var subUrl = "https://www.ipoji.com/ipo-subscription-status-live-bidding-data-bse-nse";
        using var subResp = await _httpClient.GetAsync(subUrl, cancellationToken);
        if (!subResp.IsSuccessStatusCode) return;

        var subHtml = await subResp.Content.ReadAsStringAsync(cancellationToken);
        var subDoc = new HtmlDocument();
        subDoc.LoadHtml(subHtml);

        var rows = subDoc.DocumentNode.SelectNodes("//table[contains(@class, 'subs-overview-table')]//tbody//tr");
        if (rows == null) return;

        foreach (var row in rows)
        {
            var titleNode = row.SelectSingleNode(".//span[contains(@class, 'subs-overview-ipo-title')]") ??
                            row.SelectSingleNode(".//a[contains(@class, 'subs-overview-ipo-link')]");
            var name = titleNode?.InnerText?.Trim();
            if (string.IsNullOrWhiteSpace(name)) continue;

            var key = NormalizeKey(CleanDisplayName(name));
            if (!ipoDict.TryGetValue(key, out var ipo)) continue;

            var tds = row.SelectNodes(".//td");
            if (tds == null || tds.Count < 7) continue;

            // Column 4: QIB, 5: NII, 6: Retail, 7: Total, 8: Applications
            decimal.TryParse(tds[3].InnerText.Replace("x", "").Replace("X", "").Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var qib);
            decimal.TryParse(tds[4].InnerText.Replace("x", "").Replace("X", "").Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var nii);
            decimal.TryParse(tds[5].InnerText.Replace("x", "").Replace("X", "").Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var retail);
            decimal.TryParse(tds[6].InnerText.Replace("x", "").Replace("X", "").Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var total);

            long apps = 0;
            if (tds.Count > 7)
            {
                long.TryParse(tds[7].InnerText.Replace(",", "").Trim(), out apps);
            }

            var subObj = new Dictionary<string, object>
            {
                ["overall"] = total,
                ["retail"] = retail,
                ["qib"] = qib,
                ["nii"] = nii
            };
            if (apps > 0)
            {
                subObj["applications"] = apps;
            }

            ipo.SubscriptionDataJson = JsonSerializer.Serialize(subObj);
            ipo.UpdatedAt = DateTime.UtcNow;
        }
    }

    private async Task EnrichDetailPagesAsync(List<(Ipo Ipo, string SlugUrl)> candidates, CancellationToken cancellationToken)
    {
        using var semaphore = new SemaphoreSlim(5);
        var tasks = candidates.Select(async candidate =>
        {
            await semaphore.WaitAsync(cancellationToken);
            try
            {
                var fullUrl = candidate.SlugUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                    ? candidate.SlugUrl
                    : $"https://www.ipoji.com{candidate.SlugUrl}";

                using var resp = await _httpClient.GetAsync(fullUrl, cancellationToken);
                if (!resp.IsSuccessStatusCode) return;

                var html = await resp.Content.ReadAsStringAsync(cancellationToken);

                // 1. Allotment Date from JSON-LD or text
                var allotMatch = Regex.Match(html, @"""IPO allotment date""\s*,\s*""value""\s*:\s*""([^""]+)""");
                if (allotMatch.Success && DateTime.TryParse(allotMatch.Groups[1].Value, CultureInfo.InvariantCulture, DateTimeStyles.None, out var allotDt))
                {
                    candidate.Ipo.AllotmentDate = DateOnly.FromDateTime(allotDt);
                }
                else
                {
                    // Fallback to FAQ text
                    var faqAllotMatch = Regex.Match(html, @"allotment\s+date\s+of\s+[^?]+is\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})", RegexOptions.IgnoreCase);
                    if (faqAllotMatch.Success && DateTime.TryParse(faqAllotMatch.Groups[1].Value, CultureInfo.InvariantCulture, DateTimeStyles.None, out var faqDt))
                    {
                        candidate.Ipo.AllotmentDate = DateOnly.FromDateTime(faqDt);
                    }
                }

                // 2. Registrar name from <dt>Registrar</dt><dd>...</dd>
                var regMatch = Regex.Match(html, @"<dt>\s*Registrar\s*</dt>\s*<dd>\s*([^<]+)\s*</dd>", RegexOptions.IgnoreCase);
                if (regMatch.Success)
                {
                    var registrarName = regMatch.Groups[1].Value.Trim();
                    if (!string.IsNullOrWhiteSpace(registrarName))
                    {
                        candidate.Ipo.RegistrarName = registrarName;
                        candidate.Ipo.RegistrarUrl = ResolveRegistrarUrl(registrarName);
                    }
                }

                candidate.Ipo.UpdatedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to enrich detail for {CompanyName}", candidate.Ipo.CompanyName);
            }
            finally
            {
                semaphore.Release();
            }
        });

        await Task.WhenAll(tasks);
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

            companyName = CleanDisplayName(companyName);

            bool isSme = nameTd.InnerText.Contains("SME", StringComparison.OrdinalIgnoreCase);
            var category = isSme ? IpoCategory.Sme : IpoCategory.Mainboard;

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

            var priceTd = row.SelectSingleNode(".//td[contains(@data-label,'Price')]");
            var (priceLow, priceHigh) = ParsePriceBand(priceTd?.InnerText);

            int lotSize = 1;
            var lotTd = row.SelectSingleNode(".//td[@data-label='Lot']");
            if (lotTd != null)
            {
                lotSize = ParseLotSize(lotTd.InnerText);
            }

            DateOnly? openDate = ParseSortValueOrDate(null, row.SelectSingleNode(".//td[@data-label='Open']")?.InnerText);
            DateOnly? closeDate = ParseSortValueOrDate(null, row.SelectSingleNode(".//td[@data-label='Close']")?.InnerText);
            DateOnly? listingDate = ParseSortValueOrDate(null, row.SelectSingleNode(".//td[@data-label='Listing']")?.InnerText);

            var status = CalculateStatus(openDate, closeDate, listingDate, null);

            var key = NormalizeKey(companyName);
            var ipo = await _context.Ipos.FirstOrDefaultAsync(i => i.CompanyName == companyName, cancellationToken);

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
                ipo.UpdatedAt = DateTime.UtcNow;
            }

            count++;
        }

        await _context.SaveChangesAsync(cancellationToken);
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

                companyName = CleanDisplayName(companyName);
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

    private static string CleanDisplayName(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var cleaned = Regex.Replace(raw, @"\s+(IPO|SME|NSE|BSE)\b.*$", "", RegexOptions.IgnoreCase).Trim();
        return string.IsNullOrWhiteSpace(cleaned) ? raw.Trim() : cleaned;
    }

    private static string NormalizeKey(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var cleaned = Regex.Replace(raw, @"\b(IPO|SME|NSE|BSE|Limited|Ltd\.?|Private|Pvt\.?|Enterprises|Solutions|Industries|Technologies)\b", "", RegexOptions.IgnoreCase);
        cleaned = Regex.Replace(cleaned, @"[^\w]", "");
        return cleaned.Trim().ToLowerInvariant();
    }

    private static DateOnly? ParseSortValueOrDate(string? sortVal, string? text)
    {
        if (!string.IsNullOrWhiteSpace(sortVal) &&
            long.TryParse(sortVal, out var ms) &&
            ms > 1000000000000L && ms < 4000000000000L)
        {
            return DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeMilliseconds(ms).UtcDateTime.Date);
        }

        if (string.IsNullOrWhiteSpace(text) ||
            text.Equals("N/A", StringComparison.OrdinalIgnoreCase) ||
            text == "-" || text == "—")
        {
            return null;
        }

        var clean = text.Trim();
        var normalized = clean.Replace("Sept", "Sep").Replace("Octo", "Oct");

        var formats = new[]
        {
            "d MMM yyyy", "dd MMM yyyy", "d MMMM yyyy", "dd MMMM yyyy",
            "yyyy-MM-dd", "dd-MMM-yyyy", "d-MMM-yyyy", "dd-MM-yyyy", "d/M/yyyy"
        };

        if (DateTime.TryParseExact(normalized, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt) ||
            DateTime.TryParse(normalized, CultureInfo.InvariantCulture, DateTimeStyles.None, out dt) ||
            DateTime.TryParse(clean, out dt))
        {
            return DateOnly.FromDateTime(dt);
        }

        return null;
    }

    private static (decimal? Low, decimal? High) ParsePriceBand(string? text)
    {
        if (string.IsNullOrWhiteSpace(text) || text.Contains("N/A", StringComparison.OrdinalIgnoreCase))
            return (null, null);

        var clean = text.Replace("₹", "").Replace(",", "").Trim();
        if (clean.Contains("to", StringComparison.OrdinalIgnoreCase) || clean.Contains('-'))
        {
            var parts = clean.Split(new[] { "to", "-" }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 2 &&
                decimal.TryParse(parts[0].Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var pL) &&
                decimal.TryParse(parts[1].Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var pH))
            {
                return (pL, pH);
            }
        }

        if (decimal.TryParse(clean, NumberStyles.Any, CultureInfo.InvariantCulture, out var singleP))
        {
            return (singleP, singleP);
        }

        return (null, null);
    }

    private static int ParseLotSize(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return 1;
        var clean = text.Replace(",", "").Trim();
        if (int.TryParse(clean, out var lot) && lot > 0)
        {
            return lot;
        }
        return 1;
    }

    private static string ParseExchange(string? badgesText, bool isSme)
    {
        if (string.IsNullOrWhiteSpace(badgesText))
            return isSme ? "BSE/NSE SME" : "NSE/BSE";

        bool hasNse = badgesText.Contains("NSE", StringComparison.OrdinalIgnoreCase);
        bool hasBse = badgesText.Contains("BSE", StringComparison.OrdinalIgnoreCase);

        if (hasNse && hasBse)
            return isSme ? "BSE/NSE SME" : "NSE/BSE";
        if (hasNse)
            return isSme ? "NSE SME" : "NSE";
        if (hasBse)
            return isSme ? "BSE SME" : "BSE";

        return isSme ? "BSE/NSE SME" : "NSE/BSE";
    }

    private static IpoStatus CalculateStatus(DateOnly? open, DateOnly? close, DateOnly? listing, IpoStatus? hintStatus)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (listing.HasValue && listing.Value <= today)
            return IpoStatus.Listed;
        if (close.HasValue && close.Value < today)
            return IpoStatus.Closed;
        if (open.HasValue && open.Value <= today && (!close.HasValue || close.Value >= today))
            return IpoStatus.Open;
        if (open.HasValue && open.Value > today)
            return IpoStatus.Upcoming;
        return hintStatus ?? IpoStatus.Upcoming;
    }

    private static string ResolveRegistrarUrl(string registrarName)
    {
        if (string.IsNullOrWhiteSpace(registrarName)) return string.Empty;

        foreach (var (key, url) in KnownRegistrarUrls)
        {
            if (registrarName.Contains(key, StringComparison.OrdinalIgnoreCase))
                return url;
        }

        return $"https://www.google.com/search?q={Uri.EscapeDataString(registrarName + " ipo allotment status")}";
    }
}
