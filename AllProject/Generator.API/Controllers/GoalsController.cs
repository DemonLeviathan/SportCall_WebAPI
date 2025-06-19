using Generator.API.DTO;
using Generator.Domain;
using Generator.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class GoalsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public GoalsController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [Authorize(Roles = "User")]
    [HttpGet]
    public IActionResult GetAllGoals(int userId, int page = 1, int limit = 5)
    {
        var goalsQuery = _unitOfWork.Goals.GetAll()
            .Where(g => g.UserId == userId)
            .Select(g => new GoalsDto
            {
                GoalId = g.GoalId,
                GoalName = g.GoalName,
                GoalDescription = g.GoalDescription,
                UserId = g.UserId,
                Status = g.Status
            });

        var totalGoals = goalsQuery.Count();
        var totalPages = (int)Math.Ceiling(totalGoals / (double)limit);

        var goals = goalsQuery
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToList();

        var result = new
        {
            goals = goals,
            totalPages = totalPages,
            totalGoals = totalGoals,
            currentPage = page
        };

        return Ok(result);
    }


    [Authorize(Roles = "User")]
    [HttpGet("{id}")]
    public IActionResult GetGoalById(int id)
    {
        var goal = _unitOfWork.Goals.GetById(id);
        if (goal == null) return NotFound();

        var goalDto = new GoalsDto
        {
            GoalName = goal.GoalName,
            GoalDescription = goal.GoalDescription,
            UserId = goal.UserId,
            Status = goal.Status
        };

        return Ok(goalDto);
    }

    [Authorize(Roles = "User")]
    [HttpPost]
    public IActionResult AddGoal([FromBody] GoalsDto goalDto)
    {
        if (goalDto == null)
        {
            return BadRequest("Цель не может быть пустой.");
        }

        var goal = new Goals
        {
            GoalName = goalDto.GoalName,
            GoalDescription = goalDto.GoalDescription,
            UserId = goalDto.UserId,
            Status = goalDto.Status ?? "Не выполнено"
        };

        try
        {
            _unitOfWork.Goals.Add(goal);
            _unitOfWork.Commit();
        }
        catch (Exception ex)
        {
            return StatusCode(500, "Ошибка при добавлении цели: " + ex.Message);
        }

        return CreatedAtAction(nameof(GetGoalById), new { id = goal.GoalId }, goalDto);
    }



    [Authorize(Roles = "User")]
    [HttpPut]
    public IActionResult UpdateGoal([FromBody] GoalsDto goalDto)
    {
        if (goalDto == null) return BadRequest();

        var existingGoal = _unitOfWork.Goals.GetById(goalDto.GoalId.Value);
        if (existingGoal == null) return NotFound();

        existingGoal.GoalName = goalDto.GoalName;
        existingGoal.GoalDescription = goalDto.GoalDescription;
        existingGoal.UserId = goalDto.UserId;
        existingGoal.Status = goalDto.Status; 

        _unitOfWork.Goals.Update(existingGoal);
        _unitOfWork.Commit();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteGoal(int id)
    {
        var goal = _unitOfWork.Goals.GetById(id);
        if (goal == null) return NotFound();

        _unitOfWork.Goals.Delete(goal.GoalId); 
        _unitOfWork.Commit();

        return NoContent();
    }

}
