using Generator.API.Dtos;
using Generator.Domain;
using Generator.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace Generator.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StepsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public StepsController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [Authorize(Roles = "User")]
        [HttpGet]
        public IActionResult GetAllSteps([FromQuery] int goalId)
        {
            var steps = _unitOfWork.Steps.GetAllByGoalId(goalId)
                .Select(s => new StepDto
                {
                    StepId = s.StepId,
                    StepName = s.StepName,
                    StepDescription = s.StepDescription,
                    GoalId = s.GoalId,
                    Status = s.Status
                })
                .ToList();

            return Ok(steps);
        }

        [Authorize(Roles = "User")]
        [HttpGet("{id}")]
        public IActionResult GetStepById(int id)
        {
            var step = _unitOfWork.Steps.GetById(id);
            if (step == null) return NotFound();

            var stepDto = new StepDto
            {
                StepId = step.StepId,
                StepName = step.StepName,
                StepDescription = step.StepDescription,
                GoalId = step.GoalId,
                Status = step.Status
            };

            return Ok(stepDto);
        }

        [Authorize(Roles = "User")]
        [HttpPost]
        public IActionResult AddStep([FromBody] StepDto stepDto)
        {
            if (stepDto == null)
                return BadRequest("Шаг не может быть пустым.");
            if (string.IsNullOrWhiteSpace(stepDto.StepName))
                return BadRequest("Название шага обязательно.");
            if (stepDto.GoalId <= 0)
                return BadRequest("Неверный ID цели.");

            var step = new StepsToGoal
            {
                StepName = stepDto.StepName,
                StepDescription = stepDto.StepDescription,
                GoalId = stepDto.GoalId,
                Status = stepDto.Status ?? "Не выполнено"
            };

            try
            {
                _unitOfWork.Steps.Add(step);
                _unitOfWork.Commit();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Ошибка при добавлении шага: " + ex.Message);
            }

            stepDto.StepId = step.StepId;
            return CreatedAtAction(nameof(GetStepById), new { id = step.StepId }, stepDto);
        }

        [Authorize(Roles = "User")]
        [HttpPut("{id}")]
        public IActionResult UpdateStep(int id, [FromBody] StepDto stepDto)
        {
            if (stepDto == null || id != stepDto.StepId)
                return BadRequest("Неверные данные шага.");
            if (string.IsNullOrWhiteSpace(stepDto.StepName))
                return BadRequest("Название шага обязательно.");
            if (stepDto.GoalId <= 0)
                return BadRequest("Неверный ID цели.");

            var existingStep = _unitOfWork.Steps.GetById(id);
            if (existingStep == null)
                return NotFound();

            existingStep.StepName = stepDto.StepName;
            existingStep.StepDescription = stepDto.StepDescription;
            existingStep.GoalId = stepDto.GoalId;
            existingStep.Status = stepDto.Status;

            try
            {
                _unitOfWork.Steps.Update(existingStep);
                _unitOfWork.Commit();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Ошибка при обновлении шага: " + ex.Message);
            }

            return NoContent();
        }

        [Authorize(Roles = "User")]
        [HttpDelete("{id}")]
        public IActionResult DeleteStep(int id)
        {
            var step = _unitOfWork.Steps.GetById(id);
            if (step == null)
                return NotFound();

            try
            {
                _unitOfWork.Steps.Delete(id);
                _unitOfWork.Commit();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Ошибка при удалении шага: " + ex.Message);
            }

            return NoContent();
        }
    }
}