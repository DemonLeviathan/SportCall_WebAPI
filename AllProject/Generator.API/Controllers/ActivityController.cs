using Generator.API.DTO;
using Generator.Application.Interfaces;
using Generator.Domain;
using Generator.Infrastructure;
using Generator.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace Generator.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ActivityController : Controller
    {
        private readonly IActivityService _activityService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ApplicationDbContext _context;
        public ActivityController(IActivityService activityService, IUnitOfWork unitOfWork, ApplicationDbContext _context)
        {
            _activityService = activityService;
            _unitOfWork = unitOfWork;
            this._context = _context;
        }


        // add activity admin
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public IActionResult AddActivity([FromBody] ActivityDto activityDto)
        {
            if (activityDto == null)
            {
                return BadRequest("Activity data is required.");
            }

            var activity = new Activities
            {
                activity_name = activityDto.activity_name,
                activity_type = activityDto.activity_type
            };

            _activityService.AddActivity(activity);

            return CreatedAtAction(nameof(GetActivityById), new { id = activity.activity_id }, activity);
        }

        [HttpGet("{id}")]
        public IActionResult GetActivityById(int id)
        {
            var activity = _activityService.GetActivityById(id);
            if (activity == null)
            {
                return NotFound();
            }

            return Ok(activity);
        }


        //delete activity admin
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public IActionResult DeleteActivity(int id)
        {
            var activity = _activityService.GetActivityById(id);
            if (activity == null)
            {
                return NotFound($"Activity with ID {id} not found.");
            }

            _activityService.DeleteActivity(id);
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("users")]
        public IActionResult GetAllUsers([FromQuery] string? searchTerm)
        {
            var users = _unitOfWork.Users.GetAll();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                users = users.Where(u => u.username.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            return Ok(users);
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

        [Authorize(Roles = "Admin")]
        [HttpGet("activities")]
        public IActionResult GetAllActivities([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var activities = _activityService.GetAllActivities();
            var paginatedActivities = activities
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var totalPages = (int)Math.Ceiling((double)activities.Count() / pageSize);

            return Ok(new
            {
                activities = paginatedActivities,
                totalPages = totalPages
            });
        }


        [HttpGet("types")]
        public IActionResult GetAllActivityTypes()
        {
            var activityTypes = _activityService.GetAllActivities()
                .Select(a => a.activity_type)
                .Distinct()
                .ToList();

            return Ok(activityTypes);
        }

        [HttpGet("by-type")]
        public IActionResult GetActivitiesByType([FromQuery] string activityType)
        {
            if (string.IsNullOrWhiteSpace(activityType))
            {
                return BadRequest("Activity type is required.");
            }

            var activities = _activityService.GetAllActivities()
                .Where(a => a.activity_type.Equals(activityType, StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (!activities.Any())
            {
                return NotFound($"No activities found for type '{activityType}'.");
            }

            return Ok(activities);
        }

        /// <summary>
        /// Добавить запись в DailyActivity.
        /// </summary>
        [Authorize(Roles = "User")]
        [HttpPost("add-daily-activity")]
        public async Task<IActionResult> AddDailyActivity([FromBody] DailyActivityDto dailyActivityDto)
        {
            if (dailyActivityDto == null)
            {
                Console.Error.WriteLine("Ошибка: dailyActivityDto равен null.");
                return BadRequest("Данные активности отсутствуют.");
            }

            if (dailyActivityDto.UserId <= 0)
            {
                Console.Error.WriteLine("Ошибка: UserId неверен.");
                return BadRequest("Некорректный идентификатор пользователя.");
            }

            try
            {
                var existingActivity = await _context.DailyActivities
        .FirstOrDefaultAsync(a => a.userId == dailyActivityDto.UserId && a.date.Date == DateTime.UtcNow.Date);

                if (existingActivity != null)
                    return Conflict("Активность для этого пользователя на сегодня уже существует.");

                Console.WriteLine($"Получен запрос на добавление активности: {JsonConvert.SerializeObject(dailyActivityDto)}");

                var user = await _context.Users.FirstOrDefaultAsync(u => u.user_id == dailyActivityDto.UserId);
                if (user == null)
                {
                    Console.Error.WriteLine($"Ошибка: Пользователь с ID {dailyActivityDto.UserId} не найден.");
                    return NotFound("Пользователь не найден.");
                }

                var dailyActivity = new DailyActivity
                {
                    stepQuantity = dailyActivityDto.StepQuantity,
                    otherActivityTime = dailyActivityDto.OtherActivityTime.Value,
                    userId = dailyActivityDto.UserId,
                    date = DateTime.UtcNow,
                    User = user
                };

                Console.WriteLine($"Создан объект активности: {JsonConvert.SerializeObject(dailyActivity)}");

                _context.DailyActivities.Add(dailyActivity);
                await _context.SaveChangesAsync();

                Console.WriteLine("Активность успешно сохранена.");
                return Ok("Активность успешно добавлена.");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Ошибка в AddDailyActivity: {ex.Message}");
                return StatusCode(500, "Произошла ошибка при добавлении активности.");
            }
        }


        [Authorize(Roles = "User")]
        [HttpGet("{id}/daily-activity")]
        public IActionResult GetDailyActivityById(int id)
        {
            var dailyActivity = _context.DailyActivities
                .Include(da => da.User) 
                .FirstOrDefault(da => da.dailyAcivityId == id);

            if (dailyActivity == null)
            {
                return NotFound("Активность не найдена.");
            }

            return Ok(dailyActivity);
        }

        [Authorize(Roles = "User")]
        [HttpGet("user-daily-activities/{userId}")]
        public async Task<IActionResult> GetUserDailyActivities(int userId)
        {
            var activities = await _context.DailyActivities
                .Where(a => a.userId == userId)
                .OrderByDescending(a => a.date)
                .ToListAsync();

            if (!activities.Any())
                return NotFound("Данные активности не найдены.");

            return Ok(activities);
        }


        /// <summary>
        /// Обновить запись в DailyActivity.
        /// </summary>
        [Authorize(Roles = "User")]
        [HttpPut("update-daily-activity/{id}")]
        public async Task<IActionResult> UpdateDailyActivity(int id, [FromBody] DailyActivityDto updatedActivityDto)
        {
            if (updatedActivityDto == null)
            {
                return BadRequest("Данные активности отсутствуют.");
            }

            try
            {
                var existingActivity = await _context.DailyActivities
                    .Include(da => da.User) 
                    .FirstOrDefaultAsync(da => da.dailyAcivityId == id);

                if (existingActivity == null)
                {
                    return NotFound("Активность не найдена.");
                }

                if (existingActivity.userId != updatedActivityDto.UserId)
                {
                    return BadRequest("Невозможно изменить пользователя для данной активности.");
                }

                existingActivity.stepQuantity = updatedActivityDto.StepQuantity;
                existingActivity.otherActivityTime = updatedActivityDto.OtherActivityTime;
                existingActivity.date = DateTime.UtcNow;

                _context.DailyActivities.Update(existingActivity);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Активность успешно обновлена.",
                    Activity = existingActivity
                });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Ошибка в UpdateDailyActivity: {ex.Message}");
                return StatusCode(500, "Произошла ошибка при обновлении активности.");
            }
        }


    }
}
