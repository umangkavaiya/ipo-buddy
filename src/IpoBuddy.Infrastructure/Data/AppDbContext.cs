using Microsoft.EntityFrameworkCore;
using IpoBuddy.Application.Interfaces;
using IpoBuddy.Domain.Entities;

namespace IpoBuddy.Infrastructure.Data;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Ipo> Ipos => Set<Ipo>();
    public DbSet<WatchlistItem> WatchlistItems => Set<WatchlistItem>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
    public DbSet<GroupWatchlist> GroupWatchlists => Set<GroupWatchlist>();
    public DbSet<Split> Splits => Set<Split>();
    public DbSet<SplitEntry> SplitEntries => Set<SplitEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.ClerkId).IsUnique();
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.SubscriptionTier).HasConversion<string>();
        });

        // IPO
        modelBuilder.Entity<Ipo>(entity =>
        {
            entity.HasIndex(i => new { i.Status, i.Category });
            entity.Property(i => i.Category).HasConversion<string>();
            entity.Property(i => i.Status).HasConversion<string>();
            entity.Property(i => i.IssuePriceLow).HasPrecision(10, 2);
            entity.Property(i => i.IssuePriceHigh).HasPrecision(10, 2);
            entity.Property(i => i.MinInvestment).HasPrecision(12, 2);
            entity.Property(i => i.ListingPrice).HasPrecision(10, 2);
            entity.Property(i => i.ListingGainPct).HasPrecision(6, 2);
            entity.Property(i => i.Gmp).HasPrecision(10, 2);
        });

        // Watchlist
        modelBuilder.Entity<WatchlistItem>(entity =>
        {
            entity.HasIndex(w => new { w.UserId, w.IpoId }).IsUnique();
            entity.HasOne(w => w.User).WithMany(u => u.WatchlistItems).HasForeignKey(w => w.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(w => w.Ipo).WithMany(i => i.WatchlistItems).HasForeignKey(w => w.IpoId).OnDelete(DeleteBehavior.Cascade);
        });

        // Group
        modelBuilder.Entity<Group>(entity =>
        {
            entity.HasIndex(g => g.InviteCode).IsUnique();
            entity.HasOne(g => g.CreatedBy).WithMany().HasForeignKey(g => g.CreatedById).OnDelete(DeleteBehavior.Restrict);
        });

        // Group Member
        modelBuilder.Entity<GroupMember>(entity =>
        {
            entity.HasIndex(m => new { m.GroupId, m.UserId }).IsUnique();
            entity.Property(m => m.Role).HasConversion<string>();
            entity.HasOne(m => m.Group).WithMany(g => g.Members).HasForeignKey(m => m.GroupId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(m => m.User).WithMany(u => u.GroupMemberships).HasForeignKey(m => m.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // Group Watchlist
        modelBuilder.Entity<GroupWatchlist>(entity =>
        {
            entity.HasIndex(gw => new { gw.GroupId, gw.IpoId }).IsUnique();
            entity.HasOne(gw => gw.Group).WithMany(g => g.GroupWatchlists).HasForeignKey(gw => gw.GroupId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(gw => gw.Ipo).WithMany(i => i.GroupWatchlists).HasForeignKey(gw => gw.IpoId).OnDelete(DeleteBehavior.Cascade);
        });

        // Split
        modelBuilder.Entity<Split>(entity =>
        {
            entity.Property(s => s.SplitType).HasConversion<string>();
            entity.Property(s => s.Status).HasConversion<string>();
            entity.Property(s => s.TotalAmount).HasPrecision(12, 2);
            entity.HasOne(s => s.Group).WithMany(g => g.Splits).HasForeignKey(s => s.GroupId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(s => s.CreatedBy).WithMany().HasForeignKey(s => s.CreatedById).OnDelete(DeleteBehavior.Restrict);
        });

        // Split Entry
        modelBuilder.Entity<SplitEntry>(entity =>
        {
            entity.HasIndex(e => new { e.SplitId, e.UserId }).IsUnique();
            entity.Property(e => e.Amount).HasPrecision(12, 2);
            entity.HasOne(e => e.Split).WithMany(s => s.Entries).HasForeignKey(e => e.SplitId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User).WithMany(u => u.SplitEntries).HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
