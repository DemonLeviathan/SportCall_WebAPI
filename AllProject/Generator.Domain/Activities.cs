using System.Text.Json.Serialization;

namespace Generator.Domain;

public class Activities
{
    public int activity_id {  get; set; }
    public string activity_name { get; set; }
    public string activity_type { get; set; }

    [JsonIgnore]
    public ICollection<UserData> UserData { get; set; }
}