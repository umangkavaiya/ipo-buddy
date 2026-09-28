using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using IpoBuddy.Application.Interfaces;
using IpoBuddy.Infrastructure.Data;
using IpoBuddy.Infrastructure.Services;

namespace IpoBuddy.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? "Data Source=ipobuddy.db";

        services.AddDbContext<AppDbContext>(options =>
        {
            if (connectionString.StartsWith("Host=", StringComparison.OrdinalIgnoreCase) ||
                connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
                connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            {
                options.UseNpgsql(connectionString);
            }
            else
            {
                options.UseSqlite(connectionString);
            }
        });

        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

        // HTTP Client for public scrapers with automatic redirect handling
        services.AddHttpClient<IIpoSyncService, IpoSyncService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(15);
        }).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true // For resilient dev on windows
        });

        return services;
    }
}
