using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using IpoBuddy.Application.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;

namespace IpoBuddy.Tests;

public class IpoAndWatchlistIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public IpoAndWatchlistIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<(string Token, UserDto User)> CreateUserAsync(string phone)
    {
        var verifyResp = await _client.PostAsJsonAsync("/api/auth/verify-otp", new VerifyOtpDto(phone, "123456"));
        var authResult = await verifyResp.Content.ReadFromJsonAsync<AuthResponseDto>();
        return (authResult!.Token, authResult.User);
    }

    [Fact]
    public async Task GetIpos_ReturnsSeededList()
    {
        var response = await _client.GetAsync("/api/ipos");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var ipos = await response.Content.ReadFromJsonAsync<List<IpoDto>>();
        Assert.NotNull(ipos);
        Assert.NotEmpty(ipos);
    }

    [Fact]
    public async Task GetIpos_WithCategoryFilter_FiltersProperly()
    {
        var response = await _client.GetAsync("/api/ipos?category=Mainboard");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var ipos = await response.Content.ReadFromJsonAsync<List<IpoDto>>();
        Assert.NotNull(ipos);
        Assert.All(ipos, ipo => Assert.Equal("Mainboard", ipo.Category));
    }

    [Fact]
    public async Task Watchlist_Add_Get_Remove_FullCycle()
    {
        // 1. Create a user
        var (token, user) = await CreateUserAsync("9999900099");

        // 2. Fetch an IPO to watch
        var ipoResp = await _client.GetAsync("/api/ipos");
        var ipos = await ipoResp.Content.ReadFromJsonAsync<List<IpoDto>>();
        Assert.NotNull(ipos);
        var targetIpo = ipos.First();

        // 3. Add to Watchlist
        using var addReq = new HttpRequestMessage(HttpMethod.Post, $"/api/watchlist/{targetIpo.Id}");
        addReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var addResp = await _client.SendAsync(addReq);
        Assert.Equal(HttpStatusCode.OK, addResp.StatusCode);

        // 4. Get Watchlist
        using var getReq = new HttpRequestMessage(HttpMethod.Get, "/api/watchlist");
        getReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var getResp = await _client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);

        var watchlist = await getResp.Content.ReadFromJsonAsync<List<IpoDto>>();
        Assert.NotNull(watchlist);
        Assert.Contains(watchlist, w => w.Id == targetIpo.Id);

        // 5. Remove from Watchlist
        using var delReq = new HttpRequestMessage(HttpMethod.Delete, $"/api/watchlist/{targetIpo.Id}");
        delReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var delResp = await _client.SendAsync(delReq);
        Assert.Equal(HttpStatusCode.OK, delResp.StatusCode);

        // 6. Verify Watchlist is empty again
        using var getReqAfter = new HttpRequestMessage(HttpMethod.Get, "/api/watchlist");
        getReqAfter.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var getRespAfter = await _client.SendAsync(getReqAfter);
        var watchlistAfter = await getRespAfter.Content.ReadFromJsonAsync<List<IpoDto>>();
        Assert.NotNull(watchlistAfter);
        Assert.DoesNotContain(watchlistAfter, w => w.Id == targetIpo.Id);
    }

    [Fact]
    public async Task SyncIpos_Endpoint_ReturnsSuccess()
    {
        var response = await _client.PostAsync("/api/ipos/sync", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(result);
        Assert.Equal("success", result["status"]?.ToString());
    }
}
