using Generator.Infrastructure; 
using Generator.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Generator.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")] 
    public class StatsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StatsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Глобальная статистика для админа:
        /// 1) Общее количество "completed" вызовов за текущий месяц/год.
        /// 2) Топ-10 пользователей по количеству "completed" вызовов с разбивкой по категориям.
        /// </summary>
        [HttpGet("admin")]
        public async Task<IActionResult> GetGlobalStats()
        {
            var now = DateTime.UtcNow;
            var currentYear = now.Year;
            var currentMonth = now.Month;

            var topUsersRaw = await _context.Calls
                .Where(c => c.status == "completed")
                .GroupBy(c => c.user_id)
                .Select(g => new
                {
                    UserId = g.Key,
                    CompletedCount = g.Count()
                })
                .OrderByDescending(x => x.CompletedCount)
                .Take(10)
                .ToListAsync();

            var userIds = topUsersRaw.Select(x => x.UserId).ToList();

            var usersDict = await _context.Users
                .Where(u => userIds.Contains(u.user_id))
                .ToDictionaryAsync(u => u.user_id, u => u.username);

            var topUsersCompletedCalls = await _context.Calls
                .Where(c => c.status == "completed" && userIds.Contains(c.user_id))
                .ToListAsync(); 

            var grouped = topUsersCompletedCalls
                .GroupBy(c => new { c.user_id, c.call_name })
                .Select(g => new
                {
                    UserId = g.Key.user_id,
                    Category = g.Key.call_name,
                    MonthlyCompleted = g.Count(c =>
                        DateTime.TryParse(c.call_date, out DateTime callDate) &&
                        callDate.Year == currentYear &&
                        callDate.Month == currentMonth),
                    YearlyCompleted = g.Count(c =>
                        DateTime.TryParse(c.call_date, out DateTime callDate) &&
                        callDate.Year == currentYear)
                })
                .ToList(); 

            var topUsersFinal = topUsersRaw.Select(u => new
            {
                username = usersDict.ContainsKey(u.UserId) ? usersDict[u.UserId] : $"User#{u.UserId}",
                completedCalls = u.CompletedCount,
                categories = grouped
                    .Where(c => c.UserId == u.UserId)
                    .Select(c => new
                    {
                        category = c.Category,
                        completedCalls = c.YearlyCompleted 
                    })
                    .ToList()
            }).ToList();

            int totalMonthlyCompleted = topUsersCompletedCalls.Count(c =>
                DateTime.TryParse(c.call_date, out DateTime callDate) &&
                callDate.Year == currentYear &&
                callDate.Month == currentMonth);

            int totalYearlyCompleted = topUsersCompletedCalls.Count(c =>
                DateTime.TryParse(c.call_date, out DateTime callDate) &&
                callDate.Year == currentYear);

            var result = new
            {
                totalMonthlyCompleted,
                totalYearlyCompleted,
                topUsers = topUsersFinal
            };

            return Ok(result);
        }

        /// <summary>
        /// Статистика для конкретного пользователя (по username):
        /// 1) Количество "completed" вызовов за текущий месяц.
        /// 2) Количество "completed" вызовов за текущий год.
        /// </summary>
        [HttpGet("user")]
        [AllowAnonymous] 
        public async Task<IActionResult> GetUserStats([FromQuery] string username)
        {
            if (string.IsNullOrEmpty(username))
            {
                return BadRequest("Имя пользователя не указано.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.username == username);
            if (user == null)
            {
                return NotFound($"Пользователь {username} не найден.");
            }

            var now = DateTime.UtcNow;
            var currentYear = now.Year;
            var currentMonth = now.Month;

            var userCompletedCalls = await _context.Calls
                .Where(c => c.user_id == user.user_id && c.status == "completed")
                .ToListAsync(); 

            int monthlyCompleted = userCompletedCalls.Count(c =>
                DateTime.TryParse(c.call_date, out DateTime callDate) &&
                callDate.Year == currentYear &&
                callDate.Month == currentMonth);

            int yearlyCompleted = userCompletedCalls.Count(c =>
                DateTime.TryParse(c.call_date, out DateTime callDate) &&
                callDate.Year == currentYear);

            var categoriesStats = userCompletedCalls
                .Where(c => DateTime.TryParse(c.call_date, out DateTime callDate) &&
                            callDate.Year == currentYear)
                .GroupBy(c => c.call_name)
                .Select(g => new
                {
                    category = g.Key,
                    monthlyCompleted = g.Count(c => DateTime.TryParse(c.call_date, out DateTime callDate) && callDate.Month == currentMonth),
                    yearlyCompleted = g.Count()
                })
                .ToList();

            var result = new
            {
                username = user.username,
                monthlyCompleted,
                yearlyCompleted,
                categoriesStats
            };

            return Ok(result);
        }

        /// <summary>
        /// Статистика сравнения пользователя с возрастной категорией и всеми пользователями
        /// </summary>
        [HttpGet("comparison")]
        [AllowAnonymous]
        public async Task<IActionResult> GetComparisonStats([FromQuery] string username)
        {
            if (string.IsNullOrEmpty(username))
            {
                return BadRequest("Имя пользователя не указано.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.username == username);
            if (user == null)
            {
                return NotFound($"Пользователь {username} не найден.");
            }

            var now = DateTime.UtcNow;
            var currentYear = now.Year;
            var currentMonth = now.Month;

            var userCompletedCalls = await _context.Calls
                .Where(c => c.user_id == user.user_id && c.status == "completed")
                .ToListAsync();
            int userMonthlyCompleted = userCompletedCalls.Count(c =>
                DateTime.TryParse(c.call_date, out DateTime callDate) &&
                callDate.Year == currentYear &&
                callDate.Month == currentMonth);

            int userAge = 0;
            if (!string.IsNullOrEmpty(user.birthday) && DateTime.TryParse(user.birthday, out DateTime birthDate))
            {
                userAge = (int)Math.Floor((now - birthDate).TotalDays / 365.25);
            }

            int ageGroupStart = (userAge / 5) * 5;
            int ageGroupEnd = ageGroupStart + 4;

            var allUsers = await _context.Users.ToListAsync();
            var ageGroupUsers = allUsers
                .Where(u => !string.IsNullOrEmpty(u.birthday))
                .Select(u => new { User = u, BirthDate = DateTime.TryParse(u.birthday, out DateTime birth) ? birth : DateTime.MinValue })
                .Where(u => u.BirthDate != DateTime.MinValue)
                .Where(u => (int)Math.Floor((now - u.BirthDate).TotalDays / 365.25) >= ageGroupStart &&
                           (int)Math.Floor((now - u.BirthDate).TotalDays / 365.25) <= ageGroupEnd)
                .Select(u => u.User.user_id)
                .ToList();

            var ageGroupCompletedCalls = await _context.Calls
                .Where(c => c.status == "completed" && ageGroupUsers.Contains(c.user_id))
                .ToListAsync();
            int ageGroupTotalCompleted = ageGroupCompletedCalls.Count(c =>
                DateTime.TryParse(c.call_date, out DateTime callDate) &&
                callDate.Year == currentYear &&
                callDate.Month == currentMonth);
            double ageGroupAverageMonthly = ageGroupUsers.Count > 0 ? (double)ageGroupTotalCompleted / ageGroupUsers.Count : 0;

            var allCompletedCalls = await _context.Calls
                .Where(c => c.status == "completed")
                .ToListAsync();
            int allTotalCompleted = allCompletedCalls.Count(c =>
                DateTime.TryParse(c.call_date, out DateTime callDate) &&
                callDate.Year == currentYear &&
                callDate.Month == currentMonth);
            double allAverageMonthly = (await _context.Users.CountAsync()) > 0 ? (double)allTotalCompleted / (await _context.Users.CountAsync()) : 0;

            var result = new
            {
                username = user.username,
                userMonthlyCompleted,
                ageGroupStart,
                ageGroupEnd,
                ageGroupAverageMonthly = Math.Round(ageGroupAverageMonthly, 2),
                allAverageMonthly = Math.Round(allAverageMonthly, 2)
            };

            return Ok(result);
        }
    }
}
