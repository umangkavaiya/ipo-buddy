namespace IpoBuddy.Application.Common;

public static class SplitCalculator
{
    /// <summary>
    /// Divides totalAmount among memberCount with zero penny/paise loss.
    /// Allocates any remainder cents one-by-one to ensure sum(result) == totalAmount exactly.
    /// </summary>
    public static List<decimal> DivideEqually(decimal totalAmount, int memberCount)
    {
        if (memberCount <= 0) throw new ArgumentException("Member count must be positive", nameof(memberCount));
        if (totalAmount <= 0) throw new ArgumentException("Total amount must be positive", nameof(totalAmount));

        decimal baseShare = Math.Floor((totalAmount / memberCount) * 100m) / 100m;
        decimal remainder = totalAmount - (baseShare * memberCount);
        int extraPennies = (int)Math.Round(remainder * 100m);

        var shares = new List<decimal>(memberCount);
        for (int i = 0; i < memberCount; i++)
        {
            decimal share = baseShare + (i < extraPennies ? 0.01m : 0.00m);
            shares.Add(share);
        }
        return shares;
    }
}
