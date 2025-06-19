namespace Generator.API.DTO;

public class SendChallengeDto
{
    public int SenderId { get; set; }
    public int[] ReceiverIds { get; set; } 
    public int CallId { get; set; }
    public string CallName { get; set; }
    public string Description { get; set; }
}