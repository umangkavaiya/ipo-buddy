using Microsoft.Extensions.Configuration;
using IpoBuddy.Api.Auth;
using IpoBuddy.Application.Common;

namespace IpoBuddy.Tests;

public class FinancialPrecisionTests
{
    [Fact]
    public void DivideEqually_WithCleanSplit_CalculatesExactShares()
    {
        // Act: Split ₹15,000 across 3 members
        var shares = SplitCalculator.DivideEqually(15000.00m, 3);

        // Assert
        Assert.Equal(3, shares.Count);
        Assert.All(shares, share => Assert.Equal(5000.00m, share));
        Assert.Equal(15000.00m, shares.Sum());
    }

    [Fact]
    public void DivideEqually_WithRemainderPennies_EnsuresZeroPennyLoss()
    {
        // Act: Split ₹100.00 across 3 members (100 / 3 = 33.3333...)
        var shares = SplitCalculator.DivideEqually(100.00m, 3);

        // Assert: 1 member gets 33.34, 2 get 33.33 -> exact sum is 100.00
        Assert.Equal(3, shares.Count);
        Assert.Equal(33.34m, shares[0]);
        Assert.Equal(33.33m, shares[1]);
        Assert.Equal(33.33m, shares[2]);
        Assert.Equal(100.00m, shares.Sum());
    }

    [Fact]
    public void DivideEqually_WithUnevenSevenMembers_MaintainsExactSum()
    {
        // Act: Split ₹10,000.00 across 7 members
        var shares = SplitCalculator.DivideEqually(10000.00m, 7);

        // Assert: Exactly 10,000.00 sum without float/rounding drift
        Assert.Equal(7, shares.Count);
        Assert.Equal(10000.00m, shares.Sum());
    }

    [Fact]
    public void TokenService_GeneratesAndValidates_TamperProofToken()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            {"JwtSecret", "unit-test-secret-key-for-token-validation-2026"}
        };
        IConfiguration config = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var tokenService = new TokenService(config);
        var userId = Guid.NewGuid();

        // 1. Generate valid token
        string token = tokenService.GenerateToken(userId);
        Assert.False(string.IsNullOrWhiteSpace(token));

        // 2. Validate valid token
        var validatedId = tokenService.ValidateToken(token);
        Assert.Equal(userId, validatedId);

        // 3. Tampered token fails
        string tampered = token[..^4] + "ABCD";
        var tamperedId = tokenService.ValidateToken(tampered);
        Assert.Null(tamperedId);
    }
}

