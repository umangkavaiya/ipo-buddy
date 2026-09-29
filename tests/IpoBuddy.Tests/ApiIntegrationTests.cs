using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using IpoBuddy.Application.DTOs;

namespace IpoBuddy.Tests;

public class ApiIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ApiIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetHealth_ReturnsHealthyStatus()
    {
        var response = await _client.GetAsync("/api/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(content);
        Assert.Equal("healthy", content["status"]?.ToString());
    }

    [Fact]
    public async Task CalculateTax_CalculatesCorrectSTCGTax()
    {
        var request = new TaxCalculationRequest(15000.00m);
        var response = await _client.PostAsJsonAsync("/api/tools/tax-calculator", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<TaxCalculationResponse>();

        Assert.NotNull(result);
        Assert.Equal(15000.00m, result.GrossGain);
        Assert.Equal(20.00m, result.StcgTaxRatePct);
        Assert.Equal(3000.00m, result.TaxPayable);
        Assert.Equal(12000.00m, result.NetAfterTax);
    }

    [Fact]
    public async Task AuthFlow_RequestOtp_Verify_AccessProfile()
    {
        // 1. Request OTP
        var otpReq = new RequestOtpDto("9876543210");
        var otpResp = await _client.PostAsJsonAsync("/api/auth/request-otp", otpReq);
        Assert.Equal(HttpStatusCode.OK, otpResp.StatusCode);

        // 2. Verify OTP
        var verifyReq = new VerifyOtpDto("9876543210", "123456");
        var verifyResp = await _client.PostAsJsonAsync("/api/auth/verify-otp", verifyReq);
        Assert.Equal(HttpStatusCode.OK, verifyResp.StatusCode);

        var authResult = await verifyResp.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(authResult);
        Assert.False(string.IsNullOrWhiteSpace(authResult.Token));

        // 3. Profile without token returns 401
        var unauthProfileResp = await _client.GetAsync("/api/profile");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthProfileResp.StatusCode);

        // 4. Profile with token returns 200
        using var authedRequest = new HttpRequestMessage(HttpMethod.Get, "/api/profile");
        authedRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", authResult.Token);

        var authedProfileResp = await _client.SendAsync(authedRequest);
        Assert.Equal(HttpStatusCode.OK, authedProfileResp.StatusCode);

        var profile = await authedProfileResp.Content.ReadFromJsonAsync<UserDto>();
        Assert.NotNull(profile);
        Assert.Equal("9876543210", profile.Phone);
    }
}
