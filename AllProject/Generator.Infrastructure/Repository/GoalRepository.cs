using Generator.Domain;
using Generator.Infrastructure.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;

namespace Generator.Infrastructure.Repository;

public class GoalRepository : IGoalRepository
{
    private readonly ApplicationDbContext _context;

    public GoalRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public IEnumerable<Goals> GetAll()
    {
        return _context.Goals.Include(g => g.Steps).ToList();
    }

    public Goals GetById(int id)
    {
        return _context.Goals.Include(g => g.Steps).FirstOrDefault(g => g.GoalId == id);
    }

    public void Add(Goals goal)
    {
        _context.Goals.Add(goal);
    }

    public void Update(Goals goal)
    {
        _context.Goals.Update(goal);
    }

    public void Delete(int id)
    {
        var goal = _context.Goals.Find(id);
        if (goal != null)
        {
            _context.Goals.Remove(goal);
        }
    }
}
