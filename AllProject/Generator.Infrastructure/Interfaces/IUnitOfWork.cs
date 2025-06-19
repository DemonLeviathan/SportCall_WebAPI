namespace Generator.Infrastructure.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUsersRepository Users { get; }
    IUserDataRepository UserData { get; }
    IActivityRepository Activities { get; }
    IFriendshipRepository Friendship { get; }
    ICallRepository Calls { get; }
    IGoalRepository Goals { get; }
    IStepRepository Steps { get; }
    void Commit();
    Task CommitAsync();
    void Rollback();
}