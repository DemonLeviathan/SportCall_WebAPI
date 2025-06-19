
using System.Text.Json.Serialization;

namespace Generator.Domain;

public class Calls
{
    public int call_id {  get; set; }
    public string call_name { get; set; }
    public int? friend_id { get; set; }
    public string call_date {  get; set; }
    public string status { get; set; }
    public string description { get; set; }
    public int user_id { get; set; }

    [JsonIgnore]
    public Friendship Friendship { get; set; }
}