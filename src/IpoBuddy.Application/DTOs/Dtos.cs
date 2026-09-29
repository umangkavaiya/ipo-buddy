namespace IpoBuddy.Application.DTOs;

public record RequestOtpDto(string Phone);

public record VerifyOtpDto(string Phone, string Otp);

public record UserDto(Guid Id, string? Phone, string Email, string DisplayName, string SubscriptionTier);

public record AuthResponseDto(string Token, UserDto User);

public record ProfileUpdateDto(string? DisplayName, string? Email);

public record IpoDto(
    Guid Id,
    string CompanyName,
    string? Symbol,
    string Exchange,
    string Category,
    string Status,
    decimal? IssuePriceLow,
    decimal? IssuePriceHigh,
    int LotSize,
    decimal? MinInvestment,
    DateOnly? OpenDate,
    DateOnly? CloseDate,
    DateOnly? AllotmentDate,
    DateOnly? ListingDate,
    decimal? ListingPrice,
    decimal? ListingGainPct,
    decimal? Gmp,
    string SubscriptionDataJson,
    string RegistrarName,
    string RegistrarUrl
);

public record CreateGroupDto(string Name);

public record JoinGroupDto(string InviteCode);

public record GroupMemberDto(Guid UserId, string DisplayName, string? MaskedPhone, string? Email, string Role);

public record GroupDto(Guid Id, string Name, string InviteCode, int MaxMembers, int MemberCount, DateTime CreatedAt);

public record GroupDetailDto(Guid Id, string Name, string InviteCode, int MaxMembers, List<GroupMemberDto> Members, List<Guid> WatchlistIpoIds);

public record CreateSplitDto(string Description, decimal TotalAmount);

public record SplitEntryDto(Guid EntryId, Guid UserId, string DisplayName, decimal Amount, bool IsSettled, DateTime? SettledAt);

public record SplitDto(Guid Id, Guid GroupId, string Description, decimal TotalAmount, string Status, string CreatedByName, DateTime CreatedAt, List<SplitEntryDto> Entries);

public record NetBalanceDto(Guid UserId, string DisplayName, decimal NetAmount);

public record TaxCalculationRequest(decimal GainAmount);

public record TaxCalculationResponse(decimal GrossGain, decimal StcgTaxRatePct, decimal TaxPayable, decimal NetAfterTax);
