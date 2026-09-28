namespace IpoBuddy.Domain.Entities;

public enum SplitType
{
    Equal,
    Custom
}

public enum SplitStatus
{
    Pending,
    Settled
}

public class Split
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GroupId { get; set; }
    public Group Group { get; set; } = null!;

    public Guid CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;

    public string Description { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public SplitType SplitType { get; set; } = SplitType.Equal;
    public SplitStatus Status { get; set; } = SplitStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SettledAt { get; set; }

    public ICollection<SplitEntry> Entries { get; set; } = new List<SplitEntry>();

    public bool UpdateSettledStatus()
    {
        bool hasUnsettled = Entries.Any(e => !e.IsSettled && e.UserId != CreatedById);
        if (!hasUnsettled && Status != SplitStatus.Settled)
        {
            Status = SplitStatus.Settled;
            SettledAt = DateTime.UtcNow;
            return true;
        }
        if (hasUnsettled && Status == SplitStatus.Settled)
        {
            Status = SplitStatus.Pending;
            SettledAt = null;
            return false;
        }
        return Status == SplitStatus.Settled;
    }
}

public class SplitEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SplitId { get; set; }
    public Split Split { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public decimal Amount { get; set; }
    public bool IsSettled { get; set; } = false;
    public DateTime? SettledAt { get; set; }
}
