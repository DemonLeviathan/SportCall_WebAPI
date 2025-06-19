using Generator.Application.Interfaces;
using Generator.Domain;
using Generator.Infrastructure.Interfaces;

namespace Generator.Application.Services;

public class GoalService : IGoalService
{
    private readonly IGoalRepository _goalRepository;
    private readonly IUnitOfWork _unitOfWork;

    public GoalService(IGoalRepository goalRepository, IUnitOfWork unitOfWork)
    {
        _goalRepository = goalRepository;
        _unitOfWork = unitOfWork;
    }

    public IEnumerable<Goals> GetAllGoals()
    {
        return _goalRepository.GetAll();
    }

    public Goals GetGoalById(int id)
    {
        return _goalRepository.GetById(id);
    }

    public void AddGoal(Goals goal)
    {
        //_goalRepository.Add(goal);
        _unitOfWork.Goals.Add(goal);
        _unitOfWork.Commit();
    }

    public void UpdateGoal(Goals goal)
    {
        _goalRepository.Update(goal);
        _unitOfWork.Commit();
    }

    public void DeleteGoal(int id)
    {
        _goalRepository.Delete(id);
        _unitOfWork.Commit();
    }
}
