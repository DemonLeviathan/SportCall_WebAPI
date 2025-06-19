using System.Text.Json.Serialization;

namespace Generator.Domain;

public class Friendship
{
    public int friend_id {  get; set; }
    public int user1_id { get; set; }
    public int user2_id { get; set; }
    public string friendship_date {  get; set; }
    public bool IsPending { get; set; }

    [JsonIgnore]
    public Users User1 { get; set; }
    [JsonIgnore]
    public Users User2 { get; set; }
    [JsonIgnore]
    public ICollection<Calls> Calls { get; set; }
}
