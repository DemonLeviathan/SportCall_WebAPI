using Generator.Application.Interfaces;
using Generator.Domain;
using Generator.Infrastructure.Interfaces;

namespace Generator.Application.Services;

public class UsersService : IUsersService
{
    private readonly IUnitOfWork unitOfWork;

    public UsersService(IUnitOfWork unitOfWork)
    {
        this.unitOfWork = unitOfWork;
    }
    public void RegisterUser(Users user)
    {
        if (unitOfWork.Users.UserExists(user.username))
        {
            throw new ArgumentException("User already exists.");
        }

        unitOfWork.Users.Add(user);
        unitOfWork.Commit();
    }

    public Users GetUserByUsername(string username)
    {
        return unitOfWork.Users.GetByUsername(username);
    }

    public bool UserExists(string username)
    {
        return unitOfWork.Users.UserExists(username);
    } 

}
