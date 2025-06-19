using Generator.Domain;

namespace Generator.Infrastructure.Interfaces;

public interface IStepRepository
{
    IEnumerable<StepsToGoal> GetAllByGoalId(int goalId);
    StepsToGoal GetById(int id);
    void Add(StepsToGoal step);
    void Update(StepsToGoal step);
    void Delete(int id);
}