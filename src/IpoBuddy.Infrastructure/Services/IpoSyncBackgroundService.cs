using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace IpoBuddy.Infrastructure.Services;

public class IpoSyncBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<IpoSyncBackgroundService> _logger;
    private readonly TimeSpan _syncInterval = TimeSpan.FromMinutes(30);

    public IpoSyncBackgroundService(IServiceScopeFactory scopeFactory, ILogger<IpoSyncBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("IPO Background Sync Service initialized.");

        // Initial delay to allow API to boot cleanly
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var syncService = scope.ServiceProvider.GetRequiredService<IIpoSyncService>();

                _logger.LogInformation("Executing scheduled background IPO synchronization...");
                int count = await syncService.SyncIposAsync(stoppingToken);
                _logger.LogInformation("Background IPO sync completed successfully. Total processed: {Count}", count);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogWarning(ex, "Background IPO sync encountered an error. Will retry in next interval.");
            }

            await Task.Delay(_syncInterval, stoppingToken);
        }
    }
}
