namespace IpoBuddy.Domain.Entities;

public enum SubscriptionTier
{
    Free,
    Pro
}

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? ClerkId { get; set; }
    public string? Phone { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public SubscriptionTier SubscriptionTier { get; set; } = SubscriptionTier.Free;
    public DateTime? SubscriptionExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<GroupMember> GroupMemberships { get; set; } = new List<GroupMember>();
    public ICollection<WatchlistItem> WatchlistItems { get; set; } = new List<WatchlistItem>();
    public ICollection<SplitEntry> SplitEntries { get; set; } = new List<SplitEntry>();
}
