using Generator.Domain;

namespace Generator.Application.Interfaces;

public interface IUsersService
{
    void RegisterUser(Users user);
    Users GetUserByUsername(string username);
    bool UserExists(string username);
}
