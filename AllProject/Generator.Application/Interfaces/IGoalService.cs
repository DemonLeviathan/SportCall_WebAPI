using Generator.Domain;

namespace Generator.Application.Interfaces;

public interface IGoalService
{
    IEnumerable<Goals> GetAllGoals();
    Goals GetGoalById(int id);
    void AddGoal(Goals goal);
    void UpdateGoal(Goals goal);
    void DeleteGoal(int id);
}