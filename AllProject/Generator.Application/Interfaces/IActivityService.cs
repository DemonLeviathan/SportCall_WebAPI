using Generator.Domain;

public interface IActivityService
{
    void AddActivity(Activities activity);
    Activities GetActivityById(int id);
    IEnumerable<Activities> GetAllActivities(); 
    void DeleteActivity(int id);
    void UpdateActivity(Activities activity); 
}
