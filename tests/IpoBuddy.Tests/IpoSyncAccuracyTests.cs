using System.Net;
using System.Net.Http.Json;
using IpoBuddy.Application.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;

namespace IpoBuddy.Tests;

public class IpoSyncAccuracyTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public IpoSyncAccuracyTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task SyncIpos_IngestsAccurateIpoJiData_WithProperFields()
    {
        // Trigger real-time sync
        var syncResp = await _client.PostAsync("/api/ipos/sync", null);
        Assert.Equal(HttpStatusCode.OK, syncResp.StatusCode);

        // Fetch all IPOs
        var listResp = await _client.GetAsync("/api/ipos");
        Assert.Equal(HttpStatusCode.OK, listResp.StatusCode);

        var ipos = await listResp.Content.ReadFromJsonAsync<List<IpoDto>>();
        Assert.NotNull(ipos);
        Assert.NotEmpty(ipos);

        // Verify we ingested a rich dataset
        Assert.True(ipos.Count >= 200, $"Expected >= 200 IPOs, got {ipos.Count}");

        // Verify that openDate or closeDate are populated accurately
        var iposWithDates = ipos.Where(i => i.OpenDate.HasValue || i.CloseDate.HasValue || i.ListingDate.HasValue).ToList();
        Assert.True(iposWithDates.Count > 100, "Expected majority of IPOs to have accurate dates");

        // Verify categories are properly distinguished
        var mainboardIpos = ipos.Where(i => i.Category == "Mainboard").ToList();
        var smeIpos = ipos.Where(i => i.Category == "Sme").ToList();
        Assert.NotEmpty(mainboardIpos);
        Assert.NotEmpty(smeIpos);

        // Verify price bands and lot sizes
        var iposWithPrices = ipos.Where(i => i.IssuePriceHigh.HasValue && i.IssuePriceHigh.Value > 0).ToList();
        Assert.NotEmpty(iposWithPrices);

        var iposWithLots = ipos.Where(i => i.LotSize > 1).ToList();
        Assert.NotEmpty(iposWithLots);

        // Verify GMP data is present for active/hot IPOs
        var iposWithGmp = ipos.Where(i => i.Gmp.HasValue && i.Gmp.Value > 0).ToList();
        Assert.NotEmpty(iposWithGmp);

        // Verify subscription data JSON is structured
        var iposWithSub = ipos.Where(i => i.SubscriptionDataJson != "{}" && i.SubscriptionDataJson.Contains("retail")).ToList();
        Assert.NotEmpty(iposWithSub);
    }
}
