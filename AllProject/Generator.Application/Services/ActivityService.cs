using Generator.Application.Interfaces;
using Generator.Domain;
using Generator.Infrastructure.Interfaces;

namespace Generator.Application.Services;

public class ActivityService : IActivityService
{
    private readonly IUnitOfWork unitOfWork;

    public ActivityService(IUnitOfWork unitOfWork)
    {
        this.unitOfWork = unitOfWork;
    }

    public void AddActivity(Activities activity)
    {
        if (activity == null)
        {
            throw new ArgumentNullException(nameof(activity), "Activity cannot be null");
        }

        unitOfWork.Activities.Add(activity);
        unitOfWork.Commit();
    }

    public void DeleteActivity(int id)
    {
        var activity = unitOfWork.Activities.GetById(id);
        if (activity == null)
        {
            throw new ArgumentException($"Activity with ID {id} does not exist.");
        }

        unitOfWork.Activities.Remove(activity);
        unitOfWork.Commit();
    }

    public Activities GetActivityById(int id)
    {
        return unitOfWork.Activities.GetById(id);
    }

    public IEnumerable<Activities> GetAllActivities()
    {
        // Получаем все активности через репозиторий
        return unitOfWork.Activities.GetAll();
    }

    public void UpdateActivity(Activities activity)
    {
        if (activity == null)
        {
            throw new ArgumentNullException(nameof(activity), "Activity cannot be null");
        }

        unitOfWork.Activities.Update(activity);
        unitOfWork.Commit();
    }
}
