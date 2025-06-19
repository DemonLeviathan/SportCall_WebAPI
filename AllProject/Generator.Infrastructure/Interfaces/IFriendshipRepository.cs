using Generator.Domain;

namespace Generator.Infrastructure.Interfaces;

public interface IFriendshipRepository
{
    Task AddFriendshipAsync(Friendship friendship);
    Task<Friendship?> GetFriendshipByIdAsync(int friendshipId);
    Task<bool> FriendshipExistsAsync(int user1Id, int user2Id);
    Task<List<Friendship>> GetFriendsAsync(int userId);
    Task<List<Friendship>> GetPendingRequestsAsync(int userId);
    void RemoveFriendship(Friendship friendship);
}