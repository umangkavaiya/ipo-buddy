using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IpoBuddy.Api.Auth;
using IpoBuddy.Application.DTOs;
using IpoBuddy.Application.Interfaces;
using IpoBuddy.Domain.Entities;

namespace IpoBuddy.Api.Endpoints;

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/auth/request-otp", (RequestOtpDto dto) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Phone) || dto.Phone.Length < 10)
            {
                return Results.BadRequest(new { status = "error", message = "Valid phone number required" });
            }

            return Results.Ok(new
            {
                status = "success",
                message = "OTP sent to phone",
                mock_otp = "123456" // For development ease
            });
        }).WithTags("Authentication").WithSummary("Request OTP for login/registration");

        group.MapPost("/auth/verify-otp", async (
            VerifyOtpDto dto,
            IAppDbContext db,
            TokenService tokenService) =>
        {
            if (dto.Otp != "123456")
            {
                return Results.BadRequest(new { status = "error", message = "Invalid OTP. Use '123456' for dev." });
            }

            string phone = dto.Phone.Trim();
            var user = await db.Users.FirstOrDefaultAsync(u => u.Phone == phone);
            if (user == null)
            {
                user = new User
                {
                    Phone = phone,
                    DisplayName = $"Investor {phone[^4..]}"
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
            }

            string token = tokenService.GenerateToken(user.Id);
            var response = new AuthResponseDto(
                token,
                new UserDto(user.Id, user.Phone, user.Email, user.DisplayName, user.SubscriptionTier.ToString())
            );

            return Results.Ok(response);
        }).WithTags("Authentication").WithSummary("Verify OTP and get Bearer token");

        group.MapGet("/profile", async (ClaimsPrincipal principal, IAppDbContext db) =>
        {
            var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Results.Unauthorized();

            var user = await db.Users.FindAsync(userId);
            if (user == null) return Results.NotFound();

            return Results.Ok(new UserDto(user.Id, user.Phone, user.Email, user.DisplayName, user.SubscriptionTier.ToString()));
        }).RequireAuthorization().WithTags("Profile").WithSummary("Get authenticated user profile");

        group.MapPatch("/profile", async (
            ProfileUpdateDto dto,
            ClaimsPrincipal principal,
            IAppDbContext db) =>
        {
            var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Results.Unauthorized();

            var user = await db.Users.FindAsync(userId);
            if (user == null) return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(dto.DisplayName))
            {
                user.DisplayName = dto.DisplayName.Trim();
            }
            if (dto.Email != null)
            {
                user.Email = dto.Email.Trim().ToLowerInvariant();
            }
            user.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();

            return Results.Ok(new UserDto(user.Id, user.Phone, user.Email, user.DisplayName, user.SubscriptionTier.ToString()));
        }).RequireAuthorization().WithTags("Profile").WithSummary("Update profile display name or email");

        return group;
    }
}
