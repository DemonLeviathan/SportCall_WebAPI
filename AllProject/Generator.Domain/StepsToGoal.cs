namespace Generator.Domain;

public class StepsToGoal
{
    public int StepId { get; set; }
    public string StepName { get; set; }
    public string StepDescription { get; set; }
    public int GoalId { get; set; }
    public string Status { get; set; }

    public Goals Goal { get; set; }
}
