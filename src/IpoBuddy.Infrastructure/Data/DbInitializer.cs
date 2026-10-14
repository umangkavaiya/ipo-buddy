using System.Globalization;
using System.Reflection;
using System.Text.Json;
using IpoBuddy.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IpoBuddy.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedInitialDataAsync(AppDbContext db)
    {
        if (await db.Ipos.AnyAsync()) return;

        var verifiedList = LoadVerifiedIposFromEmbeddedJson();
        if (verifiedList.Count > 0)
        {
            await db.Ipos.AddRangeAsync(verifiedList);
            await db.SaveChangesAsync();
            return;
        }

        // Hardcoded safety net fallback
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var ipos = new List<Ipo>
        {
            new()
            {
                Id = Guid.NewGuid(),
                CompanyName = "KRN Heat Exchanger and Refrigeration Ltd",
                Symbol = "KRNHEAT",
                Exchange = "NSE/BSE",
                Category = IpoCategory.Mainboard,
                Status = IpoStatus.Open,
                IssuePriceLow = 209.00m,
                IssuePriceHigh = 220.00m,
                LotSize = 65,
                MinInvestment = 14300.00m,
                OpenDate = today.AddDays(-1),
                CloseDate = today.AddDays(2),
                AllotmentDate = today.AddDays(4),
                ListingDate = today.AddDays(7),
                Gmp = 238.00m,
                GmpUpdatedAt = DateTime.UtcNow,
                RegistrarName = "Bigshare Services Pvt Ltd",
                RegistrarUrl = "https://www.bigshareonline.com/ipo_Allotment.html",
                SubscriptionDataJson = "{\"overall\": 24.1, \"retail\": 18.5, \"qib\": 32.4, \"nii\": 28.2}"
            },
            new()
            {
                Id = Guid.NewGuid(),
                CompanyName = "Manba Finance Ltd",
                Symbol = "MANBA",
                Exchange = "NSE/BSE",
                Category = IpoCategory.Mainboard,
                Status = IpoStatus.Closed,
                IssuePriceLow = 114.00m,
                IssuePriceHigh = 120.00m,
                LotSize = 125,
                MinInvestment = 15000.00m,
                OpenDate = today.AddDays(-5),
                CloseDate = today.AddDays(-1),
                AllotmentDate = today.AddDays(1),
                ListingDate = today.AddDays(4),
                Gmp = 55.00m,
                GmpUpdatedAt = DateTime.UtcNow,
                RegistrarName = "Link Intime India Pvt Ltd",
                RegistrarUrl = "https://linkintime.co.in/initial_offer/public-issues.html",
                SubscriptionDataJson = "{\"overall\": 73.2, \"retail\": 70.1, \"qib\": 65.4, \"nii\": 84.8}"
            },
            new()
            {
                Id = Guid.NewGuid(),
                CompanyName = "Hyundai Motor India Ltd",
                Symbol = "HYUNDAI",
                Exchange = "NSE/BSE",
                Category = IpoCategory.Mainboard,
                Status = IpoStatus.Upcoming,
                IssuePriceLow = 1865.00m,
                IssuePriceHigh = 1960.00m,
                LotSize = 7,
                MinInvestment = 13720.00m,
                OpenDate = today.AddDays(7),
                CloseDate = today.AddDays(10),
                AllotmentDate = today.AddDays(12),
                ListingDate = today.AddDays(15),
                Gmp = 165.00m,
                GmpUpdatedAt = DateTime.UtcNow,
                RegistrarName = "KFin Technologies Ltd",
                RegistrarUrl = "https://kosmic.kfintech.com/ipostatus",
                SubscriptionDataJson = "{}"
            }
        };

        await db.Ipos.AddRangeAsync(ipos);
        await db.SaveChangesAsync();
    }

    public static List<Ipo> LoadVerifiedIposFromEmbeddedJson()
    {
        var assembly = typeof(DbInitializer).Assembly;
        using var stream = assembly.GetManifestResourceStream("IpoBuddy.Infrastructure.Data.verified_ipos.json");
        if (stream == null) return new List<Ipo>();

        using var reader = new StreamReader(stream);
        var json = reader.ReadToEnd();
        using var doc = JsonDocument.Parse(json);
        var list = new List<Ipo>();

        foreach (var elem in doc.RootElement.EnumerateArray())
        {
            try
            {
                var idStr = elem.GetProperty("Id").GetString();
                var id = Guid.TryParse(idStr, out var gid) ? gid : Guid.NewGuid();
                var name = elem.GetProperty("CompanyName").GetString() ?? "";
                if (string.IsNullOrWhiteSpace(name)) continue;

                var symbol = elem.TryGetProperty("Symbol", out var sym) && sym.ValueKind == JsonValueKind.String ? sym.GetString() : null;
                var exchange = elem.TryGetProperty("Exchange", out var ex) && ex.ValueKind == JsonValueKind.String ? ex.GetString() ?? "NSE/BSE" : "NSE/BSE";

                var catStr = elem.TryGetProperty("Category", out var cat) ? cat.GetString() : "Mainboard";
                var category = Enum.TryParse<IpoCategory>(catStr, true, out var parsedCat) ? parsedCat : IpoCategory.Mainboard;

                var statusStr = elem.TryGetProperty("Status", out var stat) ? stat.GetString() : "Open";
                var status = Enum.TryParse<IpoStatus>(statusStr, true, out var parsedStat) ? parsedStat : IpoStatus.Open;

                decimal? priceLow = ParseDecimal(elem, "IssuePriceLow");
                decimal? priceHigh = ParseDecimal(elem, "IssuePriceHigh");
                int lotSize = elem.TryGetProperty("LotSize", out var lot) && lot.TryGetInt32(out var l) ? l : 1;
                decimal? minInvest = ParseDecimal(elem, "MinInvestment");

                DateOnly? openDate = ParseDate(elem, "OpenDate");
                DateOnly? closeDate = ParseDate(elem, "CloseDate");
                DateOnly? allotmentDate = ParseDate(elem, "AllotmentDate");
                DateOnly? listingDate = ParseDate(elem, "ListingDate");

                decimal? gmp = ParseDecimal(elem, "Gmp");
                var subJson = elem.TryGetProperty("SubscriptionDataJson", out var sub) && sub.ValueKind == JsonValueKind.String ? sub.GetString() ?? "{}" : "{}";
                var regName = elem.TryGetProperty("RegistrarName", out var rn) && rn.ValueKind == JsonValueKind.String ? rn.GetString() ?? "" : "";
                var regUrl = elem.TryGetProperty("RegistrarUrl", out var ru) && ru.ValueKind == JsonValueKind.String ? ru.GetString() ?? "" : "";

                list.Add(new Ipo
                {
                    Id = id,
                    CompanyName = name,
                    Symbol = symbol,
                    Exchange = exchange,
                    Category = category,
                    Status = status,
                    IssuePriceLow = priceLow,
                    IssuePriceHigh = priceHigh,
                    LotSize = lotSize,
                    MinInvestment = minInvest,
                    OpenDate = openDate,
                    CloseDate = closeDate,
                    AllotmentDate = allotmentDate,
                    ListingDate = listingDate,
                    Gmp = gmp,
                    SubscriptionDataJson = subJson,
                    RegistrarName = regName,
                    RegistrarUrl = regUrl,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            catch
            {
                // Ignore any malformed entry
            }
        }

        return list;
    }

    private static decimal? ParseDecimal(JsonElement elem, string propName)
    {
        if (!elem.TryGetProperty(propName, out var prop) || prop.ValueKind == JsonValueKind.Null) return null;
        if (prop.ValueKind == JsonValueKind.Number && prop.TryGetDecimal(out var d)) return d;
        if (prop.ValueKind == JsonValueKind.String && decimal.TryParse(prop.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var ds)) return ds;
        return null;
    }

    private static DateOnly? ParseDate(JsonElement elem, string propName)
    {
        if (!elem.TryGetProperty(propName, out var prop) || prop.ValueKind == JsonValueKind.Null) return null;
        if (prop.ValueKind == JsonValueKind.String && DateOnly.TryParse(prop.GetString(), CultureInfo.InvariantCulture, out var dt)) return dt;
        return null;
    }
}
