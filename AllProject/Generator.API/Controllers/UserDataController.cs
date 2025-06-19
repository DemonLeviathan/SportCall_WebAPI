using Generator.API.DTO;
using Generator.Domain;
using Generator.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Generator.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserDataController : Controller
    {
        private readonly ApplicationDbContext _context;

        public UserDataController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserData(int id)
        {
            var userData = await _context.UserData
                .Include(ud => ud.Activity)  
                .FirstOrDefaultAsync(ud => ud.data_id == id);

            if (userData == null)
                return NotFound($"User data with ID '{id}' not found.");

            return Ok(userData);
        }

        // add user data
        [Authorize(Policy = "UserPolicy")]
        [HttpPost]
        public async Task<IActionResult> AddUserData([FromBody] UserDataDto userDataDto)
        {
            if (userDataDto == null)
                return BadRequest("User data cannot be null.");

            var token = Request.Headers["Authorization"].ToString();
            Console.WriteLine(token); 
            
                Console.WriteLine(User.Identity.Name);

            foreach (var claim in User.Claims)
            {
                Console.WriteLine($"Claim Type: {claim.Type}, Claim Value: {claim.Value}");
            }


            var userNameClaim = User.Claims.FirstOrDefault(); 

            if (userNameClaim == null)
                { return Unauthorized("User is not authorized."); }

            string userName = userNameClaim.Value;
            Console.WriteLine($"UserName from JWT: {userName}");

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.username == userName); 

            if (user == null)
                return BadRequest($"User with name '{userName}' not found.");

            var activity = await _context.Activities
                .FirstOrDefaultAsync(a => a.activity_name == userDataDto.activity_name);

            if (activity == null)
                return BadRequest($"Activity with name '{userDataDto.activity_name}' not found.");

            var userData = new UserData
            {
                user_id = user.user_id, 
                activity_id = activity.activity_id,
                weight = userDataDto.weight,
                height = userDataDto.height
            };

            try
            {
                _context.UserData.Add(userData);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetUserData), new { id = userData.data_id }, userData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [Authorize(Policy = "UserPolicy")]
        [HttpGet("all")]
        public async Task<IActionResult> GetAllUserData(string username, int page = 1, int size = 10)
        {
            if (string.IsNullOrEmpty(username))
            {
                return BadRequest("Имя пользователя отсутствует.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.username == username);
            if (user == null)
            {
                return NotFound($"Пользователь с именем '{username}' не найден.");
            }

            var userDataQuery = _context.UserData.Where(ud => ud.user_id == user.user_id);

            var totalRecords = await userDataQuery.CountAsync();

            var userDataRecords = await userDataQuery
                .Skip((page - 1) * size)
                .Take(size)
                .ToListAsync();

            var activityIds = userDataRecords.Select(ud => ud.activity_id).Distinct();
            var activities = await _context.Activities
                .Where(a => activityIds.Contains(a.activity_id))
                .ToDictionaryAsync(a => a.activity_id);

            var records = userDataRecords.Select(ud => new
            {
                ud.data_id,
                ud.date_info,
                ActivityName = activities.ContainsKey(ud.activity_id) ? activities[ud.activity_id].activity_name : null,
                ActivityType = activities.ContainsKey(ud.activity_id) ? activities[ud.activity_id].activity_type : null,
                ud.weight,
                ud.height,
            }).ToList();

            var totalPages = (int)Math.Ceiling((double)totalRecords / size);

            return Ok(new
            {
                records,
                totalPages,
            });
        }
    }
}
