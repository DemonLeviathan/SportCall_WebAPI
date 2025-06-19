using Generator.API.DTO;
using Generator.Domain;
using Generator.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Asn1.Ocsp;

[Route("api/[controller]")]
[ApiController]
public class AccountController : Controller
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly TokenService _tokenService;

    public AccountController(IUnitOfWork unitOfWork, TokenService tokenService)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] RegisterDto registerDto)
    {
        if (_unitOfWork.Users.UserExists(registerDto.username))
        {
            return BadRequest("User already exists.");
        }

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(registerDto.password);

        var user = new Users
        {
            username = registerDto.username,
            password = hashedPassword,
            birthday = registerDto.birthday
        };

        _unitOfWork.Users.Add(user);
        _unitOfWork.Commit();

        return Ok("User registered successfully.");
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDto loginDto)
    {
        var user = _unitOfWork.Users.GetByUsername(loginDto.username);

        if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.password, user.password))
        {
            return Unauthorized("Invalid username or password.");
        }

        var token = _tokenService.GenerateToken(user);

        return Ok(new { Token = token });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", string.Empty);

        if (string.IsNullOrEmpty(token))
        {
            return BadRequest("No token provided.");
        }

        try
        {
            _tokenService.BlacklistToken(token); 
        }
        catch (Exception ex)
        {
            return BadRequest($"Error during logout: {ex.Message}");
        }

        return Ok("Logged out successfully.");
    }
}
