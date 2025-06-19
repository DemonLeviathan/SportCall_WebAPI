namespace Generator.API.Dtos;

public class StepDto
{
    public int StepId { get; set; }
    public string StepName { get; set; }
    public string StepDescription { get; set; }
    public int GoalId { get; set; }
    public string Status { get; set; }
}