using System.Text.Json.Serialization;

namespace Generator.Domain;

public class Users
{
    public int user_id { get; set; }
    public string username { get; set; }
    public string password { get; set; }
    public string birthday { get; set; }
    public string user_role { get; set; } = "User";

    [JsonIgnore]
    public ICollection<UserData> UserData { get; set; }

    [JsonIgnore]
    public ICollection<Friendship> Friendships1 { get; set; }

    [JsonIgnore]
    public ICollection<Friendship> Friendships2 { get; set; }

    [JsonIgnore]
    public ICollection<Calls> Calls { get; set; }

    [JsonIgnore]
    public ICollection<DailyActivity> DailyActivities { get; set; }
}