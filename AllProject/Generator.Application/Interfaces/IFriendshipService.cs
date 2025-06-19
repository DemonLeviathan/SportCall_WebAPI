using Generator.Domain;

namespace Generator.Application.Interfaces;

public interface IFriendshipService
{
    Task AddFriendshipAsync(Friendship friendship);
    Task<Friendship?> GetFriendshipByIdAsync(int friendshipId);
    Task<List<Friendship>> GetFriendsAsync(int userId);
    Task<List<Friendship>> GetPendingRequestsAsync(int userId);
    Task RespondToFriendRequestAsync(int friendshipId, bool accept);
    Task RemoveFriendshipAsync(int friendshipId);
}