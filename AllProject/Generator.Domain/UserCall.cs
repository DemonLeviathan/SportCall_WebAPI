// Models/UserCall.cs
using Generator.Domain;

public class UserCall
{
    public int UserCallId { get; set; }
    public int UserId { get; set; } 
    public int CallId { get; set; } 
    public string Status { get; set; } 
    public DateTime AssignedAt { get; set; } 


    public Users User { get; set; }
    public Calls Call { get; set; }
}
