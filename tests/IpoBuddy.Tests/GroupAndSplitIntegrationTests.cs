using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using IpoBuddy.Application.DTOs;

namespace IpoBuddy.Tests;

public class GroupAndSplitIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public GroupAndSplitIntegrationTests(CustomWebApplicationFactory factory)
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
    public async Task GroupCreation_And_JoinWithInviteCode_Success()
    {
        // 1. Create User A (Admin)
        var (tokenA, userA) = await CreateUserAsync("9999900001");

        // 2. User A creates group
        using var createGroupReq = new HttpRequestMessage(HttpMethod.Post, "/api/groups")
        {
            Content = JsonContent.Create(new CreateGroupDto("Alpha IPO Syndicate"))
        };
        createGroupReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenA);

        var createGroupResp = await _client.SendAsync(createGroupReq);
        Assert.Equal(HttpStatusCode.OK, createGroupResp.StatusCode);

        var group = await createGroupResp.Content.ReadFromJsonAsync<GroupDto>();
        Assert.NotNull(group);
        Assert.Equal("Alpha IPO Syndicate", group.Name);
        Assert.False(string.IsNullOrWhiteSpace(group.InviteCode));
        Assert.Equal(1, group.MemberCount);

        // 3. Create User B
        var (tokenB, userB) = await CreateUserAsync("9999900002");

        // 4. User B joins group with invite code
        using var joinReq = new HttpRequestMessage(HttpMethod.Post, "/api/groups/join")
        {
            Content = JsonContent.Create(new JoinGroupDto(group.InviteCode))
        };
        joinReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenB);

        var joinResp = await _client.SendAsync(joinReq);
        Assert.Equal(HttpStatusCode.OK, joinResp.StatusCode);

        var joinedGroup = await joinResp.Content.ReadFromJsonAsync<GroupDto>();
        Assert.NotNull(joinedGroup);
        Assert.Equal(2, joinedGroup.MemberCount);
    }

    [Fact]
    public async Task SplitFlow_CreateSplit_SettleEntry_BalancesCalculated()
    {
        // 1. Setup User 1 and User 2 in a group
        var (token1, user1) = await CreateUserAsync("9999900011");
        var (token2, user2) = await CreateUserAsync("9999900012");

        using var createGroupReq = new HttpRequestMessage(HttpMethod.Post, "/api/groups")
        {
            Content = JsonContent.Create(new CreateGroupDto("Split Test Group"))
        };
        createGroupReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token1);
        var groupResp = await _client.SendAsync(createGroupReq);
        var group = await groupResp.Content.ReadFromJsonAsync<GroupDto>();

        using var joinReq = new HttpRequestMessage(HttpMethod.Post, "/api/groups/join")
        {
            Content = JsonContent.Create(new JoinGroupDto(group!.InviteCode))
        };
        joinReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token2);
        await _client.SendAsync(joinReq);

        // 2. User 1 creates a split of ₹15,000 across the 2 members
        using var splitReq = new HttpRequestMessage(HttpMethod.Post, $"/api/groups/{group.Id}/splits")
        {
            Content = JsonContent.Create(new CreateSplitDto("XYZ Listing Gain", 15000.00m))
        };
        splitReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token1);
        var splitResp = await _client.SendAsync(splitReq);
        Assert.Equal(HttpStatusCode.OK, splitResp.StatusCode);

        var split = await splitResp.Content.ReadFromJsonAsync<SplitDto>();
        Assert.NotNull(split);
        Assert.Equal(2, split.Entries.Count);
        Assert.Equal(7500.00m, split.Entries[0].Amount);
        Assert.Equal(7500.00m, split.Entries[1].Amount);

        // Creator entry is settled, member entry is pending
        var user2Entry = split.Entries.First(e => e.UserId == user2.Id);
        Assert.False(user2Entry.IsSettled);

        // 3. User 1 checks net balances: User 2 owes User 1 ₹7,500
        using var balanceReq1 = new HttpRequestMessage(HttpMethod.Get, "/api/splits/balances");
        balanceReq1.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token1);
        var balanceResp1 = await _client.SendAsync(balanceReq1);
        var balances1 = await balanceResp1.Content.ReadFromJsonAsync<List<NetBalanceDto>>();
        Assert.NotNull(balances1);
        var user2Bal = balances1.FirstOrDefault(b => b.UserId == user2.Id);
        Assert.NotNull(user2Bal);
        Assert.Equal(7500.00m, user2Bal.NetAmount);

        // 4. Settle the entry
        using var settleReq = new HttpRequestMessage(HttpMethod.Post, $"/api/splits/{split.Id}/settle/{user2Entry.EntryId}");
        settleReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token2);
        var settleResp = await _client.SendAsync(settleReq);
        Assert.Equal(HttpStatusCode.OK, settleResp.StatusCode);

        // 5. Balance after settlement is 0
        using var balanceReqAfter = new HttpRequestMessage(HttpMethod.Get, "/api/splits/balances");
        balanceReqAfter.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token1);
        var balanceRespAfter = await _client.SendAsync(balanceReqAfter);
        var balancesAfter = await balanceRespAfter.Content.ReadFromJsonAsync<List<NetBalanceDto>>();
        Assert.NotNull(balancesAfter);
        Assert.Empty(balancesAfter);
    }
}
