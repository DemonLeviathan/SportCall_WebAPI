using Generator.Domain;

public class Challenge
{
    public int ChallengeId { get; set; }
    public int SenderId { get; set; } 
    public int ReceiverId { get; set; } 
    public int CallId { get; set; } 
    public string Status { get; set; } 
    public DateTime SentAt { get; set; } 
    public DateTime? RespondedAt { get; set; } 

    public Users Sender { get; set; }
    public Users Receiver { get; set; }
    public Calls Call { get; set; }
}
