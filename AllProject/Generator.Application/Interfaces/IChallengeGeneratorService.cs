using Generator.Domain;

namespace Generator.Application.Interfaces;

public interface IChallengeGeneratorService
{
    Calls GenerateDailyCall(Users user, int? friendId);
    Calls GenerateWeeklyCall(Users user, int? friendId);
    Calls GenerateMonthlyCall(Users user, int? friendId);
}