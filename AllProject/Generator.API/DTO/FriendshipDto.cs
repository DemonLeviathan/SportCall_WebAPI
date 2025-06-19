namespace Generator.API.DTO;

public class FriendshipDto
{
    public int user1_id { get; set; }
    public int user2_id { get; set; }
    public bool IsPending { get; set; }
}
