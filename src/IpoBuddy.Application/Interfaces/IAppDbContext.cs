using Microsoft.EntityFrameworkCore;
using IpoBuddy.Domain.Entities;

namespace IpoBuddy.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Ipo> Ipos { get; }
    DbSet<WatchlistItem> WatchlistItems { get; }
    DbSet<Group> Groups { get; }
    DbSet<GroupMember> GroupMembers { get; }
    DbSet<GroupWatchlist> GroupWatchlists { get; }
    DbSet<Split> Splits { get; }
    DbSet<SplitEntry> SplitEntries { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
