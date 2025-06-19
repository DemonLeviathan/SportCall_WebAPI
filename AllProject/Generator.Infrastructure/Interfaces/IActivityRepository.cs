using Generator.Domain;

public interface IActivityRepository
{
    void Add(Activities activity);
    Activities GetById(int id);
    void Remove(Activities activity);
    IEnumerable<Activities> GetAll(); 
    void Update(Activities activity); 
}
