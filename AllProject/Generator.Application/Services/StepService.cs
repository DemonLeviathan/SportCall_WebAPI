using Generator.Application.Interfaces;
using Generator.Domain;
using Generator.Infrastructure.Interfaces;

namespace Generator.Application.Services;

public class StepService : IStepService
{
    private readonly IStepRepository _stepRepository;
    private readonly IUnitOfWork _unitOfWork;

    public StepService(IStepRepository stepRepository, IUnitOfWork unitOfWork)
    {
        _stepRepository = stepRepository;
        _unitOfWork = unitOfWork;
    }

    public IEnumerable<StepsToGoal> GetStepsByGoalId(int goalId)
    {
        return _stepRepository.GetAllByGoalId(goalId);
    }

    public StepsToGoal GetStepById(int id)
    {
        return _stepRepository.GetById(id);
    }

    public void AddStep(StepsToGoal step)
    {
        _stepRepository.Add(step);
        _unitOfWork.Commit();
    }

    public void UpdateStep(StepsToGoal step)
    {
        _stepRepository.Update(step);
        _unitOfWork.Commit();
    }

    public void DeleteStep(int id)
    {
        _stepRepository.Delete(id);
        _unitOfWork.Commit();
    }
}
