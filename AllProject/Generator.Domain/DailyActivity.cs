using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;


namespace Generator.Domain;

public class DailyActivity
{
    public int dailyAcivityId { get; set; }
    public int stepQuantity { get; set; }
    public float? otherActivityTime { get; set; }
    public int userId { get; set; }
    public DateTime date { get; set; }

    [JsonIgnore]
    public Users User { get; set; }
}