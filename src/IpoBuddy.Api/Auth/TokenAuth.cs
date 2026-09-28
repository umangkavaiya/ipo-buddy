using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace IpoBuddy.Api.Auth;

public class TokenService
{
    private readonly byte[] _key;
    private const int TokenLifetimeDays = 30;

    public TokenService(IConfiguration config)
    {
        var secret = config["JwtSecret"] ?? "ipo-buddy-super-secret-key-2026-financial-precision-token";
        _key = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
    }

    public string GenerateToken(Guid userId)
    {
        long expiry = DateTimeOffset.UtcNow.AddDays(TokenLifetimeDays).ToUnixTimeSeconds();
        string payload = $"{userId}:{expiry}";
        using var hmac = new HMACSHA256(_key);
        string sig = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));
        return Convert.ToBase64String(Encoding.UTF8.GetBytes($"{payload}:{sig}"));
    }

    public Guid? ValidateToken(string token)
    {
        try
        {
            string raw = Encoding.UTF8.GetString(Convert.FromBase64String(token));
            var parts = raw.Split(':');
            if (parts.Length != 3) return null;

            if (!Guid.TryParse(parts[0], out var userId)) return null;
            if (!long.TryParse(parts[1], out var expiry)) return null;
            string sig = parts[2];

            if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() > expiry) return null;

            string payload = $"{userId}:{expiry}";
            using var hmac = new HMACSHA256(_key);
            string expectedSig = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));

            if (CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(sig),
                Encoding.UTF8.GetBytes(expectedSig)))
            {
                return userId;
            }
            return null;
        }
        catch
        {
            return null;
        }
    }
}

public class TokenAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly TokenService _tokenService;

    public TokenAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        TokenService tokenService) : base(options, logger, encoder)
    {
        _tokenService = tokenService;
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var authHeader))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        string headerValue = authHeader.ToString();
        if (!headerValue.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        string token = headerValue["Bearer ".Length..].Trim();
        var userId = _tokenService.ValidateToken(token);
        if (!userId.HasValue)
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid or expired token"));
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString()),
            new Claim("sub", userId.Value.ToString())
        };

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
