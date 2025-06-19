using Generator.Domain;
using Generator.Infrastructure;
using Generator.Infrastructure.Interfaces;

namespace Generator.Application;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public IActivityRepository Activities { get; }
    public ICallRepository Calls { get; }
    public IFriendshipRepository Friendship { get; }
    public IUserDataRepository UserData { get; }
    public IUsersRepository Users { get; }
    public IGoalRepository Goals { get; }
    public IStepRepository Steps { get; }

    public UnitOfWork(ApplicationDbContext context, IActivityRepository activityRepository, ICallRepository callRepository, IFriendshipRepository friendshipRepository, IUserDataRepository userDataRepository, IUsersRepository usersRepository, IGoalRepository goals, IStepRepository step)
    {
        _context = context;
        Activities = activityRepository;
        Calls = callRepository;
        Friendship = friendshipRepository;
        UserData = userDataRepository;
        Users = usersRepository;
        Goals = goals;
        Steps = step;
    }

    public void Commit()
    {
        _context.SaveChanges();
    }
    public async Task CommitAsync()
    {
        await _context.SaveChangesAsync();
    }
    public void Dispose()
    {
        _context.Dispose();
    }

    public void Rollback()
    {

    }
}