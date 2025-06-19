using Generator.Application.Interfaces;
using Generator.Domain;
using System;
using System.Collections.Generic;

namespace Generator.Application.Services
{
    public class ChallengeGeneratorService : IChallengeGeneratorService
    {
        private static readonly Random RandomGenerator = new Random();

        public Calls GenerateDailyCall(Users user, int? friendId)
        {
            (int age, float bmi) = GetAgeAndBmi(user);

            var activity = DefineGroup(age, bmi, "daily");

            return new Calls
            {
                call_name = $"Ежедневный вызов: {activity.Item1}",
                friend_id = friendId,
                call_date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                status = "pending",
                description = activity.Item2,
                user_id = user.user_id
            };
        }


        public Calls GenerateWeeklyCall(Users user, int? friendId)
        {
            (int age, float bmi) = GetAgeAndBmi(user);
            var activity = DefineGroup(age, bmi, "weekly");

            return new Calls
            {
                call_name = $"Еженедельный вызов: {activity.Item1}",
                friend_id = friendId,
                call_date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                status = "pending",
                description = activity.Item2,
                user_id = user.user_id 
            };
        }

        public Calls GenerateMonthlyCall(Users user, int? friendId)
        {
            (int age, float bmi) = GetAgeAndBmi(user);
            var activity = DefineGroup(age, bmi, "monthly");

            return new Calls
            {
                call_name = $"Ежемесячный вызов: {activity.Item1}",
                friend_id = friendId,
                call_date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                status = "pending",
                description = activity.Item2,
                user_id = user.user_id 
            };
        }

        private (string taskName, string description) DefineGroup(int age, float bmi, string frequency, string? preferredActivity = null)
        {
            int freqMultiplier = frequency switch
            {
                "weekly" => 7,
                "monthly" => 30,
                _ => 1
            };

            List<(string Task, string Description)> group;

            if (age < 14 || age > 60 || bmi >= 30)
            {
                group = new List<(string, string)>
                {
                    (
                        "Ходьба",
                        $"Пройдите {RandomGenerator.Next(3000, 10000) * freqMultiplier} шагов {GetTime(frequency)}"
                    ),
                    (
                        "Бассейн",
                        $"Посетите бассейн. Плавайте {RandomGenerator.Next(30, 60) * freqMultiplier} минут {GetTime(frequency)}"
                    )
                };
            }
            else if (age >= 14 && age <= 45 && bmi >= 18.5 && bmi < 25)
            {
                group = new List<(string, string)>
                {
                    (
                        "Бег",
                        $"Пробегите {RandomGenerator.Next(1, 3) * freqMultiplier} км {GetTime(frequency)}"
                    ),
                    (
                        "Занятие в тренажёрном зале",
                        $"Посетите тренажерный зал. Проведите тренировку длительностью {RandomGenerator.Next(40, 150) * freqMultiplier} минут {GetTime(frequency)}"
                    ),
                    (
                        "Беговые упражнения",
                        $"Сделайте {RandomGenerator.Next(20, 40) * freqMultiplier} минут беговых упражнений {GetTime(frequency)}"
                    )
                };
            }
            else
            {
                group = new List<(string, string)>
                {
                    (
                        "Ходьба",
                        $"Пройдите {RandomGenerator.Next(4000, 8000) * freqMultiplier} шагов {GetTime(frequency)}"
                    ),
                    (
                        "Бассейн",
                        $"Посетите бассейн. Плавайте {RandomGenerator.Next(25, 40) * freqMultiplier} минут {GetTime(frequency)}"
                    )
                };
            }

            if (string.IsNullOrEmpty(preferredActivity))
            {
                var task = group[RandomGenerator.Next(group.Count)];
                Console.WriteLine($"Сгенерированное задание без предпочтений: {task.Task}");
                return task;
            }

            var filteredGroup = group.Where(activity => IsActivityMatched(activity.Task, preferredActivity)).ToList();
            if (!filteredGroup.Any())
            {
                Console.WriteLine("Нет соответствующих заданий, выбрано задание по умолчанию.");
                var fallbackTask = group[RandomGenerator.Next(group.Count)];
                return fallbackTask;
            }

            var matchedTask = filteredGroup[RandomGenerator.Next(filteredGroup.Count)];
            Console.WriteLine($"Сгенерированное задание с предпочтениями: {matchedTask.Task}");
            return matchedTask;
        }



        private bool IsActivityMatched(string activityTask, string preferredActivity)
        {
            return preferredActivity switch
            {
                "Team sport" => activityTask.Contains("беговые упражнения", StringComparison.OrdinalIgnoreCase)
                               || activityTask.Contains("тренировки", StringComparison.OrdinalIgnoreCase),
                "Athletics" => activityTask.Contains("бег", StringComparison.OrdinalIgnoreCase)
                               || activityTask.Contains("беговые упражнения", StringComparison.OrdinalIgnoreCase),
                "Swimming" => activityTask.Contains("бассейн", StringComparison.OrdinalIgnoreCase),
                "Walking" => activityTask.Contains("ходьба", StringComparison.OrdinalIgnoreCase),
                _ => false
            };
        }

        private string GetTime(string frequency)
        {
            return frequency switch
            {
                "daily" => "сегодня",
                "weekly" => "на этой неделе",
                "monthly" => "в этом месяце",
                _ => "в ближайшее время"
            };
        }

        private (int age, float bmi) GetAgeAndBmi(Users user)
        {
            DateTime birthDate;
            int age = 0;

            if (DateTime.TryParse(user.birthday, out birthDate))
            {
                age = CalculateAge(birthDate, DateTime.UtcNow);
            }
            else
            {
                age = 18; 
            }

            if (user.UserData == null || !user.UserData.Any())
            {
                Console.WriteLine("UserData отсутствует.");
                return (age, 0f); 
            }

            var latestUserData = user.UserData.OrderByDescending(ud => ud.date_info).FirstOrDefault();
            if (latestUserData == null)
            {
                Console.WriteLine("Последние данные отсутствуют.");
                return (age, 0f);
            }

            float weight = latestUserData.weight;
            float height = latestUserData.height / 100f; 

            float bmi = CalculateBMI(weight, height);
            Console.WriteLine($"Возраст: {age}, BMI: {bmi}");
            return (age, bmi);
        }


        private int CalculateAge(DateTime birthDate, DateTime now)
        {
            int age = now.Year - birthDate.Year;
            if (now < birthDate.AddYears(age))
                age--;
            return age;
        }

        private float CalculateBMI(float weight, float height)
        {
            if (height <= 0.0)
                return 0.0f;

            return weight / (height * height);
        }
    }
}
