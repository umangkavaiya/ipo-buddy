namespace IpoBuddy.Domain.Entities;

public enum IpoCategory
{
    Mainboard,
    Sme
}

public enum IpoStatus
{
    Upcoming,
    Open,
    Closed,
    Listed
}

public class Ipo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CompanyName { get; set; } = string.Empty;
    public string? Symbol { get; set; }
    public string Exchange { get; set; } = "NSE/BSE";
    public IpoCategory Category { get; set; } = IpoCategory.Mainboard;
    public IpoStatus Status { get; set; } = IpoStatus.Upcoming;

    public decimal? IssuePriceLow { get; set; }
    public decimal? IssuePriceHigh { get; set; }
    public int LotSize { get; set; } = 1;
    public decimal? MinInvestment { get; set; }

    public DateOnly? OpenDate { get; set; }
    public DateOnly? CloseDate { get; set; }
    public DateOnly? AllotmentDate { get; set; }
    public DateOnly? ListingDate { get; set; }

    public decimal? ListingPrice { get; set; }
    public decimal? ListingGainPct { get; set; }
    public decimal? Gmp { get; set; }
    public DateTime? GmpUpdatedAt { get; set; }

    public string SubscriptionDataJson { get; set; } = "{}";
    public string RegistrarName { get; set; } = string.Empty;
    public string RegistrarUrl { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<WatchlistItem> WatchlistItems { get; set; } = new List<WatchlistItem>();
    public ICollection<GroupWatchlist> GroupWatchlists { get; set; } = new List<GroupWatchlist>();
}

public class WatchlistItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid IpoId { get; set; }
    public Ipo Ipo { get; set; } = null!;

    public bool AlertOnOpen { get; set; } = true;
    public bool AlertOnAllotment { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
