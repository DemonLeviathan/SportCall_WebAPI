using Generator.Infrastructure.Interfaces;

namespace Generator.Infrastructure.Repository;

public class CallRepository : ICallRepository
{
    private readonly ApplicationDbContext _context;

    public CallRepository(ApplicationDbContext context)
    {
        _context = context;
    }
}
