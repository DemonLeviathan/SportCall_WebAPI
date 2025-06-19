using Generator.Application.Interfaces;
using Generator.Domain;
using Generator.Infrastructure.Interfaces;

namespace Generator.Application.Services;

public class FriendshipService : IFriendshipService
{
    private readonly IUnitOfWork _unitOfWork;

    public FriendshipService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task AddFriendshipAsync(Friendship friendship)
    {
        if (await _unitOfWork.Friendship.FriendshipExistsAsync(friendship.user1_id, friendship.user2_id))
        {
            throw new ArgumentException("Friendship already exists or is pending.");
        }

        await _unitOfWork.Friendship.AddFriendshipAsync(friendship);
        await _unitOfWork.CommitAsync();
    }

    public async Task<Friendship?> GetFriendshipByIdAsync(int friendshipId)
    {
        return await _unitOfWork.Friendship.GetFriendshipByIdAsync(friendshipId);
    }

    public async Task<List<Friendship>> GetFriendsAsync(int userId)
    {
        return await _unitOfWork.Friendship.GetFriendsAsync(userId);
    }

    public async Task<List<Friendship>> GetPendingRequestsAsync(int userId)
    {
        return await _unitOfWork.Friendship.GetPendingRequestsAsync(userId);
    }

    public async Task RespondToFriendRequestAsync(int friendshipId, bool accept)
    {
        var friendship = await GetFriendshipByIdAsync(friendshipId);

        if (friendship == null || !friendship.IsPending)
        {
            throw new ArgumentException("Friend request not found or already processed.");
        }

        if (accept)
        {
            friendship.IsPending = false;
            friendship.friendship_date = DateTime.UtcNow.ToString("yyyy-MM-dd");
        }
        else
        {
            _unitOfWork.Friendship.RemoveFriendship(friendship);
        }

        await _unitOfWork.CommitAsync();
    }

    public async Task RemoveFriendshipAsync(int friendshipId)
    {
        var friendship = await GetFriendshipByIdAsync(friendshipId);

        if (friendship == null)
        {
            throw new ArgumentException("Friendship not found.");
        }

        _unitOfWork.Friendship.RemoveFriendship(friendship);
        await _unitOfWork.CommitAsync();
    }
}