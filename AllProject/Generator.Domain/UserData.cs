using System.Text.Json.Serialization;

namespace Generator.Domain;

public class UserData
{
    public int data_id { get; set; }
    public int user_id { get; set; }
    public int activity_id { get; set; }
    public DateTime date_info { get; set; }
    public float weight { get; set; }
    public float height { get; set; }

    [JsonIgnore]
    public Activities Activity { get; set; }
    [JsonIgnore]
    public Users User { get; set; }
}
