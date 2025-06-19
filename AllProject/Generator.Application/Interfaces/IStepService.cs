using Generator.Domain;

namespace Generator.Application.Interfaces;

public interface IStepService
{
    IEnumerable<StepsToGoal> GetStepsByGoalId(int goalId);
    StepsToGoal GetStepById(int id);
    void AddStep(StepsToGoal step);
    void UpdateStep(StepsToGoal step);
    void DeleteStep(int id);
}