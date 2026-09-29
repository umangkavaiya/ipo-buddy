using IpoBuddy.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IpoBuddy.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedInitialDataAsync(AppDbContext db)
    {
        if (await db.Ipos.AnyAsync()) return;

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
            },
            new()
            {
                Id = Guid.NewGuid(),
                CompanyName = "Bajaj Housing Finance Ltd",
                Symbol = "BAJAJHFL",
                Exchange = "NSE/BSE",
                Category = IpoCategory.Mainboard,
                Status = IpoStatus.Listed,
                IssuePriceLow = 66.00m,
                IssuePriceHigh = 70.00m,
                LotSize = 214,
                MinInvestment = 14980.00m,
                OpenDate = today.AddDays(-20),
                CloseDate = today.AddDays(-17),
                AllotmentDate = today.AddDays(-15),
                ListingDate = today.AddDays(-12),
                ListingPrice = 150.00m,
                ListingGainPct = 114.28m,
                Gmp = 82.00m,
                GmpUpdatedAt = DateTime.UtcNow,
                RegistrarName = "KFin Technologies Ltd",
                RegistrarUrl = "https://kosmic.kfintech.com/ipostatus",
                SubscriptionDataJson = "{\"overall\": 67.4, \"retail\": 7.0, \"qib\": 222.0, \"nii\": 43.5}"
            },
            new()
            {
                Id = Guid.NewGuid(),
                CompanyName = "Diffusor Precision Engineering Ltd",
                Symbol = "DIFFUSOR",
                Exchange = "BSE SME",
                Category = IpoCategory.Sme,
                Status = IpoStatus.Open,
                IssuePriceLow = 100.00m,
                IssuePriceHigh = 105.00m,
                LotSize = 1200,
                MinInvestment = 126000.00m,
                OpenDate = today.AddDays(-2),
                CloseDate = today.AddDays(1),
                AllotmentDate = today.AddDays(3),
                ListingDate = today.AddDays(6),
                Gmp = 45.00m,
                GmpUpdatedAt = DateTime.UtcNow,
                RegistrarName = "Maashitla Securities Pvt Ltd",
                RegistrarUrl = "https://maashitla.com/allotment-status",
                SubscriptionDataJson = "{\"overall\": 14.8, \"retail\": 18.2, \"nii\": 11.4}"
            },
            new()
            {
                Id = Guid.NewGuid(),
                CompanyName = "Northern Arc Capital Ltd",
                Symbol = "NORTHARC",
                Exchange = "NSE/BSE",
                Category = IpoCategory.Mainboard,
                Status = IpoStatus.Listed,
                IssuePriceLow = 249.00m,
                IssuePriceHigh = 263.00m,
                LotSize = 57,
                MinInvestment = 14991.00m,
                OpenDate = today.AddDays(-14),
                CloseDate = today.AddDays(-11),
                AllotmentDate = today.AddDays(-9),
                ListingDate = today.AddDays(-6),
                ListingPrice = 351.00m,
                ListingGainPct = 33.46m,
                Gmp = 128.00m,
                GmpUpdatedAt = DateTime.UtcNow,
                RegistrarName = "KFin Technologies Ltd",
                RegistrarUrl = "https://kosmic.kfintech.com/ipostatus",
                SubscriptionDataJson = "{\"overall\": 117.2, \"retail\": 32.0, \"qib\": 241.0, \"nii\": 148.0}"
            }
        };

        db.Ipos.AddRange(ipos);
        await db.SaveChangesAsync();
    }
}
