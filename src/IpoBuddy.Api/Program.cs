using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using IpoBuddy.Api.Auth;
using IpoBuddy.Api.Endpoints;
using IpoBuddy.Application.DTOs;
using IpoBuddy.Infrastructure;
using IpoBuddy.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Dynamic PORT for cloud hosting (e.g. Render, Railway)
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://*:{port}");
}

// 1. Clean Architecture Infrastructure Layer
builder.Services.AddInfrastructureServices(builder.Configuration);

// 2. Authentication & Authorization (Clerk JWT + Local Dev TokenAuth)
builder.Services.AddSingleton<TokenService>();
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = "UnifiedAuth";
    options.DefaultChallengeScheme = "UnifiedAuth";
})
.AddPolicyScheme("UnifiedAuth", "Clerk or TokenAuth", options =>
{
    options.ForwardDefaultSelector = context =>
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            var token = authHeader["Bearer ".Length..].Trim();
            if (token.Count(c => c == '.') == 2)
            {
                return JwtBearerDefaults.AuthenticationScheme;
            }
        }
        return "TokenAuth";
    };
})
.AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
{
    var clerkIssuer = builder.Configuration["Clerk:Issuer"] ?? "https://darling-pigeon-465.clerk.accounts.dev";
    options.Authority = clerkIssuer;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateAudience = false,
        ValidateIssuer = true,
        ValidIssuer = clerkIssuer,
        NameClaimType = ClaimTypes.NameIdentifier
    };
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            var principal = context.Principal;
            var clerkId = principal?.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal?.FindFirstValue("sub");
            if (string.IsNullOrEmpty(clerkId)) return;

            var user = await db.Users.FirstOrDefaultAsync(u => u.ClerkId == clerkId);
            if (user == null)
            {
                var email = principal?.FindFirstValue(ClaimTypes.Email) 
                         ?? principal?.FindFirstValue("email") 
                         ?? $"{clerkId}@clerk.user";
                var name = principal?.FindFirstValue(ClaimTypes.Name) 
                        ?? principal?.FindFirstValue("name") 
                        ?? email.Split('@')[0];

                user = new IpoBuddy.Domain.Entities.User
                {
                    Id = Guid.NewGuid(),
                    ClerkId = clerkId,
                    Email = email,
                    DisplayName = name,
                    Phone = null
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
            }

            var appIdentity = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim("clerk_id", clerkId),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.DisplayName)
            }, "ClerkAppIdentity");
            principal?.AddIdentity(appIdentity);
        }
    };
})
.AddScheme<AuthenticationSchemeOptions, TokenAuthHandler>("TokenAuth", null);
builder.Services.AddAuthorization();

// 3. CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 4. OpenAPI
builder.Services.AddOpenApi();

var app = builder.Build();

// Auto-create database schema on startup for local dev
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.EnsureCreated();
    }
    catch
    {
        // Safe ignore concurrent race in parallel test executions
    }
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Interactive API Documentation via OpenAPI + Scalar
app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.WithTitle("IPO Buddy API Reference")
           .WithTheme(ScalarTheme.Moon);
});

// Root & Health Check
app.MapGet("/", () => Results.Redirect("/scalar/v1"));
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    app = "IPO Buddy API",
    framework = ".NET 10 Clean Architecture",
    timestamp = DateTime.UtcNow
})).WithTags("System");

// Tax Calculator Tool (Stateless)
app.MapPost("/api/tools/tax-calculator", (TaxCalculationRequest req) =>
{
    decimal gain = Math.Max(0m, req.GainAmount);
    decimal rate = 20.00m; // Indian STCG rate under Section 111A
    decimal tax = Math.Round(gain * (rate / 100.00m), 2);
    decimal net = gain - tax;

    return Results.Ok(new TaxCalculationResponse(gain, rate, tax, net));
}).WithTags("Tools").WithSummary("Calculate 20% Short-Term Capital Gains (STCG) tax on listing gains");

// Map Modular Clean Architecture Endpoints
app.MapGroup("/api").MapAuthEndpoints();
app.MapGroup("/api").MapIpoEndpoints();
app.MapGroup("/api").MapGroupEndpoints();
app.MapGroup("/api").MapSplitEndpoints();

app.Run();

// Required for integration testing
public partial class Program { }
