using Generator.Infrastructure.Interfaces;

namespace Generator.Infrastructure.Repository;

public class UserDataRepository : IUserDataRepository
{
    private readonly ApplicationDbContext _context;

    public UserDataRepository(ApplicationDbContext context)
    {
        _context = context;
    }
}
