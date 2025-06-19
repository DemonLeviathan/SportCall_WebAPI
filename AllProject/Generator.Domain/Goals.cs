using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Generator.Domain;

public class Goals
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]  
    public int GoalId { get; set; }

    public string GoalName { get; set; }
    public string GoalDescription { get; set; }
    public int UserId { get; set; }
    public string Status { get; set; }

    public ICollection<StepsToGoal> Steps { get; set; }
}