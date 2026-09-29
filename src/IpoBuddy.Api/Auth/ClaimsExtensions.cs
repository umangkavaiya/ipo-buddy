using System.Security.Claims;

namespace IpoBuddy.Api.Auth;

public static class ClaimsExtensions
{
    public static Guid? GetUserId(this ClaimsPrincipal principal)
    {
        foreach (var claim in principal.FindAll(ClaimTypes.NameIdentifier))
        {
            if (Guid.TryParse(claim.Value, out var id))
                return id;
        }

        var sub = principal.FindFirstValue("sub");
        if (Guid.TryParse(sub, out var subId))
            return subId;

        return null;
    }
}
