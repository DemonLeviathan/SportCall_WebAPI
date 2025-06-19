using Generator.Domain;
using Generator.Infrastructure.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;

namespace Generator.Infrastructure.Repository;

public class StepRepository : IStepRepository
{
    private readonly ApplicationDbContext _context;

    public StepRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public IEnumerable<StepsToGoal> GetAllByGoalId(int goalId)
    {
        return _context.Steps.Where(s => s.GoalId == goalId).ToList();
    }

    public StepsToGoal GetById(int id)
    {
        return _context.Steps.Find(id);
    }

    public void Add(StepsToGoal step)
    {
        _context.Steps.Add(step);
    }

    public void Update(StepsToGoal step)
    {
        _context.Steps.Update(step);
    }

    public void Delete(int id)
    {
        var step = _context.Steps.Find(id);
        if (step != null)
        {
            _context.Steps.Remove(step);
        }
    }
}
