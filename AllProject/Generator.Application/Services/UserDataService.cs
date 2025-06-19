using Generator.Application.Interfaces;
using Generator.Infrastructure.Interfaces;

namespace Generator.Application.Services;

public class UserDataService : IUserDataService
{
    private readonly IUnitOfWork unitOfWork;

    public UserDataService(IUnitOfWork unitOfWork)
    {
        this.unitOfWork = unitOfWork;
    }
}
