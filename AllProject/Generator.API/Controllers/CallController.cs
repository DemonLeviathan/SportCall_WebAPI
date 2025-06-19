using Generator.API.DTO;
using Generator.Application.Interfaces;
using Generator.Domain;
using Generator.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace Generator.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CallController : Controller
{
    private readonly IChallengeGeneratorService _challengeGeneratorService;
    private readonly ApplicationDbContext _context;

    public CallController(IChallengeGeneratorService challengeGeneratorService, ApplicationDbContext context)
    {
        _challengeGeneratorService = challengeGeneratorService;
        _context = context;
    }

    /// <summary>
    /// Генерация ежедневного вызова для пользователя.
    /// </summary>
    [Authorize]
    [HttpPost("generate/daily")]
    public async Task<IActionResult> GenerateDailyCall([FromQuery] string username, [FromQuery] int? friendId = null)
    {
        if (string.IsNullOrEmpty(username))
            return BadRequest("Имя пользователя отсутствует.");

        var user = await _context.Users
            .Include(u => u.UserData) 
            .FirstOrDefaultAsync(u => u.username == username);
        if (user == null)
            return NotFound("Пользователь не найден.");

        var call = _challengeGeneratorService.GenerateDailyCall(user, friendId);
        _context.Calls.Add(call);
        await _context.SaveChangesAsync();

        return Ok(call);
    }

    /// <summary>
    /// Генерация еженедельного вызова для пользователя.
    /// </summary>
    [Authorize]
    [HttpPost("generate/weekly")]
    public async Task<IActionResult> GenerateWeeklyCall([FromQuery] string username, [FromQuery] int? friendId = null)
    {
        if (string.IsNullOrEmpty(username))
            return BadRequest("Имя пользователя отсутствует.");

        var user = await _context.Users
            .Include(u => u.UserData)
            .FirstOrDefaultAsync(u => u.username == username);
        if (user == null)
            return NotFound("Пользователь не найден.");

        var call = _challengeGeneratorService.GenerateWeeklyCall(user, friendId);
        _context.Calls.Add(call);
        await _context.SaveChangesAsync();

        return Ok(call);
    }

    /// <summary>
    /// Генерация ежемесячного вызова для пользователя.
    /// </summary>
    [Authorize]
    [HttpPost("generate/monthly")]
    public async Task<IActionResult> GenerateMonthlyCall([FromQuery] string username, [FromQuery] int? friendId = null)
    {
        if (string.IsNullOrEmpty(username))
            return BadRequest("Имя пользователя отсутствует.");

        var user = await _context.Users
            .Include(u => u.UserData)
            .FirstOrDefaultAsync(u => u.username == username);
        if (user == null)
            return NotFound("Пользователь не найден.");

        var call = _challengeGeneratorService.GenerateMonthlyCall(user, friendId);
        _context.Calls.Add(call);
        await _context.SaveChangesAsync();

        return Ok(call);
    }

    /// <summary>
    /// Обновление статуса вызова.
    /// </summary>
    [Authorize]
    [HttpPost("update-status")]
    public async Task<IActionResult> UpdateCallStatus([FromBody] UpdateCallStatusDto request)
    {
        if (request.CallId <= 0)
            return BadRequest("Некорректный ID вызова.");

        var call = await _context.Calls.FindAsync(request.CallId);
        if (call == null)
            return NotFound("Вызов не найден.");

        call.status = request.Status;
        await _context.SaveChangesAsync();

        return Ok(call);
    }



    /// <summary>
    /// Получение всех вызовов конкретного пользователя.
    /// </summary>
    [Authorize]
    [HttpGet("user-calls")]
    public async Task<IActionResult> GetUserCalls([FromQuery] string username)
    {
        if (string.IsNullOrEmpty(username))
            return BadRequest("Имя пользователя не предоставлено.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.username == username);
        if (user == null)
            return NotFound("Пользователь не найден.");

        var userCalls = await _context.Calls
            .Where(c => c.user_id == user.user_id && c.status != "rejected")
            .ToListAsync();

        if (!userCalls.Any())
        {
            Console.WriteLine("Нет вызовов для пользователя.");
            return Ok(new { calls = new List<object>() }); 
        }

        Console.WriteLine($"Найдено вызовов: {userCalls.Count}");

        return Ok(new
        {
            calls = userCalls.Select(c => new
            {
                c.call_id,
                c.call_name,
                c.status,
                c.description,
                c.call_date
            })
        });
    }

    [Authorize]
    [HttpGet("user-calls-name")]

    public async Task<IActionResult> GetUserCallsName([FromQuery] string username)
    {
        if (string.IsNullOrEmpty(username))
            return BadRequest("Имя пользователя не предоставлено.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.username == username);
        if (user == null)
            return NotFound("Пользователь не найден.");

        var userCalls = await _context.Calls
            .Where(c => c.user_id == user.user_id)
            .ToListAsync();

        if (!userCalls.Any())
        {
            Console.WriteLine("Нет вызовов для пользователя.");
            return Ok(new { calls = new List<object>() });
        }

        Console.WriteLine($"Найдено вызовов: {userCalls.Count}");

        return Ok(new
        {
            calls = userCalls.Select(c => new
            {
                c.call_name
            })
        });
    }
}

public class UpdateCallStatusDto
{
    public int CallId { get; set; }
    public string Status { get; set; }
}
