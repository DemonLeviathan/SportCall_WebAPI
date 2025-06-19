using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Generator.Infrastructure; 
using Generator.Domain;
using Generator.API.DTO;

namespace Generator.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class FriendshipController : Controller
{
    private readonly ApplicationDbContext _context;

    public FriendshipController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("add")]
    public async Task<IActionResult> AddFriend([FromBody] FriendshipDto dto)
    {
        Console.WriteLine($"Получены данные: user1_id={dto.user1_id}, user2_id={dto.user2_id}");

        if (dto == null)
        {
            Console.WriteLine("Ошибка: данные дружбы отсутствуют.");
            return BadRequest("Friendship data is missing.");
        }

        var user1 = await _context.Users.FindAsync(dto.user1_id);
        var user2 = await _context.Users.FindAsync(dto.user2_id);

        if (user1 == null || user2 == null)
        {
            Console.WriteLine($"Ошибка: Один или оба пользователя не найдены (user1_id={dto.user1_id}, user2_id={dto.user2_id}).");
            return NotFound("One or both users not found.");
        }

        var exists = await _context.Friendships.AnyAsync(f =>
            (f.user1_id == dto.user1_id && f.user2_id == dto.user2_id) ||
            (f.user1_id == dto.user2_id && f.user2_id == dto.user1_id));

        if (exists)
        {
            Console.WriteLine("Ошибка: Дружба уже существует или находится в ожидании.");
            return BadRequest("Friendship already exists or is pending.");
        }

        var friendship = new Friendship
        {
            user1_id = dto.user1_id,
            user2_id = dto.user2_id,
            friendship_date = DateTime.UtcNow.ToString(),
            IsPending = true
        };

        _context.Friendships.Add(friendship);

        try
        {
            await _context.SaveChangesAsync();
            Console.WriteLine("Запрос дружбы успешно сохранен.");
        }
        catch (DbUpdateException ex)
        {
            Console.WriteLine($"Ошибка базы данных: {ex.Message}");
            return StatusCode(500, $"Database error: {ex.Message}");
        }

        return Ok("Friend request sent.");
    }




    [HttpDelete("delete/{id}")]
    public async Task<IActionResult> RemoveFriend(int id)
    {
        var friendship = await _context.Friendships.FirstOrDefaultAsync(f => f.friend_id == id); if (friendship == null)
            return NotFound($"Friendship with id {id} not found.");

        _context.Friendships.Remove(friendship);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetFriendshipById(int id)
    {
        var friendship = await _context.Friendships.FindAsync(id);
        if (friendship == null)
            return NotFound($"Friendship with id {id} not found.");

        return Ok(friendship);
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetFriends([FromQuery] int userId, [FromQuery] int page = 1, [FromQuery] int size = 10)
    {
        var query = _context.Friendships
            .Where(f => (f.user1_id == userId || f.user2_id == userId) && !f.IsPending)
            .Include(f => f.User1)
            .Include(f => f.User2);

        var totalRecords = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalRecords / (double)size);

        var friends = await query
            .OrderBy(f => f.friend_id) 
            .Skip((page - 1) * size)
            .Take(size)
            .Select(f => new
            {
                FriendshipId = f.friend_id,
                FriendId = f.user1_id == userId ? f.user2_id : f.user1_id,
                FriendName = f.user1_id == userId ? f.User2.username : f.User1.username
            })
            .ToListAsync();

        if (!friends.Any())
            return NotFound("No friends found.");

        return Ok(new
        {
            friends,
            totalPages
        });
    }


    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications([FromQuery] int userId)
    {
        var notifications = _context.Friendships
            .Where(f => f.user2_id == userId && f.IsPending)
            .Include(f => f.User1) 
            .Select(f => new
            {
                f.friend_id, 
                SenderName = f.User1.username,
                SenderId = f.user1_id,
                RecieverName = f.User2.username,
                RecieverId = f.user2_id
            })
            .ToList();

        if (!notifications.Any())
            return Ok(new List<object>());

        return Ok(notifications);
    }



    [HttpPost("respond")]
    public async Task<IActionResult> RespondToFriendRequest([FromBody] FriendshipDto dto, [FromQuery] bool accept)
    {
        var friendship = await _context.Friendships.FirstOrDefaultAsync(f =>
            ((f.user1_id == dto.user1_id && f.user2_id == dto.user2_id) ||
             (f.user1_id == dto.user2_id && f.user2_id == dto.user1_id)) &&
            f.IsPending);

        if (friendship == null)
            return NotFound("Friend request not found.");

        if (accept)
        {
            friendship.IsPending = false; 
            friendship.friendship_date = DateTime.UtcNow.ToString("yyyy-MM-dd");
        }
        else
        {
            _context.Friendships.Remove(friendship); 
        }

        await _context.SaveChangesAsync();
        return Ok(accept ? "Friend added." : "Friend request declined.");
    }


}