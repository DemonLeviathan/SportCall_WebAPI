using System.ComponentModel.DataAnnotations;

public class DailyActivityDto
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Количество шагов должно быть больше 0.")]
    public int StepQuantity { get; set; }

    [Range(0, float.MaxValue, ErrorMessage = "Время активности должно быть больше 0.")]
    public float? OtherActivityTime { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Идентификатор пользователя обязателен.")]
    public int UserId { get; set; }
}
