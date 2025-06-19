using Generator.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Generator.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : Controller
    {
        private readonly IUnitOfWork _unitOfWork;
        public UserController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet("get-id")]
        public IActionResult GetUserId([FromQuery] string username)
        {
            if (string.IsNullOrEmpty(username))
                return BadRequest("Имя пользователя отсутствует.");

            var user = _unitOfWork.Users.GetAll()
                .FirstOrDefault(u => u.username == username);

            if (user == null)
                return NotFound($"Пользователь с именем '{username}' не найден.");

            return Ok(new { user_id = user.user_id });
        }



        [Authorize]
        [HttpGet("users")]
        public IActionResult GetAllUsers([FromQuery] string? searchTerm, [FromQuery] int page = 1, [FromQuery] int pageSize = 5)
        {
            var users = _unitOfWork.Users.GetAll();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                users = users.Where(u => u.username.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            var totalPages = (int)Math.Ceiling((double)users.Count() / pageSize);


            var paginatedUsers = users.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            return Ok(new
            {
                users = paginatedUsers,
                totalPages = totalPages
            });
        }


        [Authorize(Roles = "Admin")]
        [HttpGet("statistics")]
        public IActionResult GetOverallStatistics()
        {
            var statistics = _unitOfWork.Users.GetAll()
                .Select(u => new
                {
                    u.username,
                    ActivitiesCount = u.UserData.Count,
                    FriendsCount = u.Friendships1.Count + u.Friendships2.Count
                });

            return Ok(statistics);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("statistics/{id}")]
        public IActionResult GetUserStatistics(int id)
        {
            var user = _unitOfWork.Users.GetById(id);
            if (user == null)
            {
                return NotFound($"User with ID {id} not found.");
            }

            var statistics = new
            {
                user.username,
                ActivitiesCount = user.UserData.Count,
                FriendsCount = user.Friendships1.Count + user.Friendships2.Count
            };

            return Ok(statistics);
        }
    }
}
