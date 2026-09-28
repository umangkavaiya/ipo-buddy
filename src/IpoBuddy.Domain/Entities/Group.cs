namespace IpoBuddy.Domain.Entities;

public enum GroupRole
{
    Admin,
    Member
}

public class Group
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string InviteCode { get; set; } = string.Empty;
    public Guid CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
    public int MaxMembers { get; set; } = 5;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public ICollection<GroupWatchlist> GroupWatchlists { get; set; } = new List<GroupWatchlist>();
    public ICollection<Split> Splits { get; set; } = new List<Split>();
}

public class GroupMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GroupId { get; set; }
    public Group Group { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public GroupRole Role { get; set; } = GroupRole.Member;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

public class GroupWatchlist
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GroupId { get; set; }
    public Group Group { get; set; } = null!;

    public Guid IpoId { get; set; }
    public Ipo Ipo { get; set; } = null!;

    public Guid? AddedById { get; set; }
    public User? AddedBy { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
