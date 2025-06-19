using Generator.Application.Interfaces;
using Generator.Infrastructure.Interfaces;

namespace Generator.Application.Services;

public class CallService : ICallService 
{
    private readonly IUnitOfWork unitOfWork;

    public CallService(IUnitOfWork unitOfWork)
    {
        this.unitOfWork = unitOfWork;
    }
}
