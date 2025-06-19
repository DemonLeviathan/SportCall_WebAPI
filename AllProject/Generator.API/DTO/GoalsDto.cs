using System.Text.Json.Serialization;

namespace Generator.API.DTO;

public class GoalsDto
{
    [JsonPropertyName("goalId")]
    public int? GoalId { get; set; }

    [JsonPropertyName("goalName")]
    public string GoalName { get; set; }

    [JsonPropertyName("goalDescription")]
    public string GoalDescription { get; set; }

    [JsonPropertyName("userId")]
    public int UserId { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; }
}