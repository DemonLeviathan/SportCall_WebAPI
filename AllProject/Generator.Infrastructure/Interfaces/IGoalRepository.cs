using Generator.Domain;

namespace Generator.Infrastructure.Interfaces;

public interface IGoalRepository
{
    IEnumerable<Goals> GetAll();
    Goals GetById(int id);
    void Add(Goals goal);
    void Update(Goals goal);
    void Delete(int id);
}