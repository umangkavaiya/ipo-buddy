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
                var npgsqlConn = ParsePostgresConnectionString(connectionString);
                options.UseNpgsql(npgsqlConn);
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

    private static string ParsePostgresConnectionString(string connectionString)
    {
        if (connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
            connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uri = new Uri(connectionString);
                var userInfo = uri.UserInfo.Split(':');
                var builder = new Npgsql.NpgsqlConnectionStringBuilder
                {
                    Host = uri.Host,
                    Port = uri.Port > 0 ? uri.Port : 5432,
                    Username = userInfo[0],
                    Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
                    Database = uri.AbsolutePath.TrimStart('/'),
                    SslMode = Npgsql.SslMode.Require
                };
                return builder.ConnectionString;
            }
            catch
            {
                return connectionString;
            }
        }
        return connectionString;
    }
}
