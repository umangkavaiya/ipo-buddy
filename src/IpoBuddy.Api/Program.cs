using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using IpoBuddy.Api.Auth;
using IpoBuddy.Api.Endpoints;
using IpoBuddy.Application.DTOs;
using IpoBuddy.Infrastructure;
using IpoBuddy.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Clean Architecture Infrastructure Layer
builder.Services.AddInfrastructureServices(builder.Configuration);

// 2. Authentication & Authorization
builder.Services.AddSingleton<TokenService>();
builder.Services.AddAuthentication("TokenAuth")
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
    db.Database.EnsureCreated();
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
