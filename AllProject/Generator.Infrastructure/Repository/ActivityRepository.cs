using Generator.Domain;
using Generator.Infrastructure.Interfaces;

namespace Generator.Infrastructure.Repository;

public class ActivityRepository : IActivityRepository
{
    private readonly ApplicationDbContext _context;

    public ActivityRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public void Add(Activities activity)
    {
        if (activity == null)
        {
            throw new ArgumentNullException(nameof(activity), "Activity cannot be null");
        }

        _context.Activities.Add(activity);
    }

    public Activities GetById(int id)
    {
        return _context.Activities.FirstOrDefault(a => a.activity_id == id);
    }

    public void Remove(Activities activity)
    {
        _context.Activities.Remove(activity);
    }

    public IEnumerable<Activities> GetAll()
    {
        // Получаем список всех активностей
        return _context.Activities.ToList();
    }

    public void Update(Activities activity)
    {
        if (activity == null)
        {
            throw new ArgumentNullException(nameof(activity), "Activity cannot be null");
        }

        var existingActivity = GetById(activity.activity_id);
        if (existingActivity == null)
        {
            throw new ArgumentException($"Activity with ID {activity.activity_id} does not exist.");
        }

        existingActivity.activity_name = activity.activity_name;
        existingActivity.activity_type = activity.activity_type;

        _context.Activities.Update(existingActivity);
    }
}
