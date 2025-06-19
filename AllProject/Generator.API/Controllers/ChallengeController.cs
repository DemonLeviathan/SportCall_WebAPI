using Generator.API.DTO;
using Generator.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Generator.Domain;
using System.Linq;
using System.Threading.Tasks;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "User,Admin")]
public class ChallengeController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ChallengeController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Отправить вызов одному или нескольким друзьям.
    /// </summary>
    [HttpPost("send")]
    public async Task<IActionResult> SendChallenge([FromBody] SendChallengeDto dto)
    {
        if (dto == null || dto.ReceiverIds == null || !dto.ReceiverIds.Any())
            return BadRequest("Данные вызова или список получателей отсутствуют.");

        if (string.IsNullOrEmpty(dto.CallName) || string.IsNullOrEmpty(dto.Description))
            return BadRequest("Название вызова и описание обязательны.");

        var callExists = await _context.Calls.AnyAsync(c => c.call_id == dto.CallId);
        var senderExists = await _context.Users.AnyAsync(u => u.user_id == dto.SenderId);
        if (!callExists || !senderExists)
            return BadRequest("Неверный CallId или SenderId.");

        var validReceiverIds = await _context.Friendships
            .Where(f => f.IsPending == false &&
                        ((f.user1_id == dto.SenderId && dto.ReceiverIds.Contains(f.user2_id)) ||
                         (f.user2_id == dto.SenderId && dto.ReceiverIds.Contains(f.user1_id))))
            .Select(f => f.user1_id == dto.SenderId ? f.user2_id : f.user1_id)
            .Distinct()
            .ToListAsync();

        if (validReceiverIds.Count() != dto.ReceiverIds.Length)
            return BadRequest("Один или несколько получателей не являются подтверждёнными друзьями отправителя.");

        var existingChallenges = await _context.Challenges
            .Where(c => c.SenderId == dto.SenderId &&
                        dto.ReceiverIds.Contains(c.ReceiverId) &&
                        c.CallId == dto.CallId &&
                        c.Status == "Pending")
            .Select(c => c.ReceiverId)
            .ToListAsync();

        var newReceiverIds = dto.ReceiverIds.Except(existingChallenges).ToArray();
        if (!newReceiverIds.Any())
            return BadRequest("Все выбранные друзья уже получили этот вызов.");

        var challenges = newReceiverIds.Select(receiverId => new Challenge
        {
            SenderId = dto.SenderId,
            ReceiverId = receiverId,
            CallId = dto.CallId,
            Status = "Pending",
            SentAt = DateTime.UtcNow
        }).ToList();

        _context.Challenges.AddRange(challenges);
        await _context.SaveChangesAsync();

        return Ok("Вызовы успешно отправлены.");
    }

    /// <summary>
    /// Получить все полученные вызовы для пользователя.
    /// </summary>
    [HttpGet("received")]
    public async Task<IActionResult> GetReceivedChallenges([FromQuery] int userId)
    {
        var challenges = await _context.Challenges
            .Where(c => c.ReceiverId == userId && c.Status == "Pending")
            .Include(c => c.Sender)
            .Include(c => c.Call)
            .Select(c => new
            {
                c.ChallengeId,
                SenderName = c.Sender.username,
                CallName = c.Call.call_name,
                CallDescription = c.Call.description,
                c.SentAt
            })
            .ToListAsync();

        if (!challenges.Any())
            return NotFound("Вызовов нет.");

        return Ok(challenges);
    }

    /// <summary>
    /// Ответить на вызов (принять или отклонить).
    /// </summary>
    [HttpPost("respond")]
    public async Task<IActionResult> RespondToChallenge([FromBody] RespondChallengeDto dto)
    {
        var challenge = await _context.Challenges
            .Include(c => c.Call)
            .FirstOrDefaultAsync(c => c.ChallengeId == dto.ChallengeId);

        if (challenge == null)
            return NotFound("Вызов не найден.");

        if (challenge.Status != "Pending")
            return BadRequest("На вызов уже был дан ответ.");

        if (dto.Accept)
        {
            challenge.Status = "accepted";
            challenge.RespondedAt = DateTime.UtcNow;

            var duplicatedCall = new Calls
            {
                call_name = challenge.Call.call_name,
                description = challenge.Call.description,
                call_date = DateTime.UtcNow.ToString("yyyy-MM-dd"), 
                status = "accepted",
                user_id = challenge.ReceiverId
            };

            _context.Calls.Add(duplicatedCall);
        }
        else
        {
            challenge.Status = "rejected";
            challenge.RespondedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(dto.Accept ? "Вызов принят." : "Вызов отклонён.");
    }

    /// <summary>
    /// Получить уведомления о вызовах.
    /// </summary>
    [HttpGet("notifications")]
    public async Task<IActionResult> GetChallengeNotifications([FromQuery] int userId)
    {
        var notifications = await _context.Challenges
            .Where(c => c.ReceiverId == userId && c.Status == "Pending")
            .Include(c => c.Sender)
            .Include(c => c.Call)
            .Select(c => new
            {
                c.ChallengeId,
                CallName = c.Call.call_name,
                Description = c.Call.description,
                SenderName = c.Sender.username,
                c.SenderId,
                c.ReceiverId,
                c.SentAt
            })
            .ToListAsync();

        if (!notifications.Any())
            return Ok(new List<object>());

        return Ok(notifications);
    }
}