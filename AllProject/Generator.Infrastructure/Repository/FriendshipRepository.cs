using Generator.Domain;
using Generator.Infrastructure.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Generator.Infrastructure.Repository;

public class FriendshipRepository : IFriendshipRepository
{
    private readonly ApplicationDbContext _context;

    public FriendshipRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddFriendshipAsync(Friendship friendship)
    {
        await _context.Friendships.AddAsync(friendship);
    }

    public async Task<Friendship?> GetFriendshipByIdAsync(int friendshipId)
    {
        return await _context.Friendships
            .Include(f => f.User1)
            .Include(f => f.User2)
            .FirstOrDefaultAsync(f => f.friend_id == friendshipId);
    }

    public async Task<bool> FriendshipExistsAsync(int user1Id, int user2Id)
    {
        return await _context.Friendships.AnyAsync(f =>
            (f.user1_id == user1Id && f.user2_id == user2Id) ||
            (f.user1_id == user2Id && f.user2_id == user1Id));
    }

    public async Task<List<Friendship>> GetFriendsAsync(int userId)
    {
        return await _context.Friendships
            .Where(f => (f.user1_id == userId || f.user2_id == userId) && !f.IsPending)
            .Include(f => f.User1)
            .Include(f => f.User2)
            .ToListAsync();
    }

    public async Task<List<Friendship>> GetPendingRequestsAsync(int userId)
    {
        return await _context.Friendships
            .Where(f => f.user2_id == userId && f.IsPending)
            .Include(f => f.User1)
            .ToListAsync();
    }

    public void RemoveFriendship(Friendship friendship)
    {
        _context.Friendships.Remove(friendship);
    }
}