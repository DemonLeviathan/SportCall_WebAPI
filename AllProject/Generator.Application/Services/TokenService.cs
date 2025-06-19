using Generator.Domain;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System;
using System.Collections.Generic;

public class TokenService
{
    private readonly IConfiguration _configuration;
    private static readonly HashSet<string> _blacklistedTokens = new HashSet<string>();

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    // Генерация токена
    public string GenerateToken(Users user)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.username),  
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),  
            //new Claim(ClaimTypes.NameIdentifier, user.user_id.ToString()),  
            new Claim(ClaimTypes.Role, user.user_role)  
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddMinutes(30),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public void BlacklistToken(string token)
    {
        _blacklistedTokens.Add(token);
    }

    public bool IsTokenBlacklisted(string token)
    {
        return _blacklistedTokens.Contains(token);
    }

    public bool ValidateToken(string token)
    {
        if (IsTokenBlacklisted(token)) return false;

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]);

        try
        {
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidAudience = _configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ClockSkew = TimeSpan.Zero  
            }, out var validatedToken);

            return validatedToken != null;
        }
        catch (SecurityTokenException ex)
        {
            Console.WriteLine($"Token validation failed: {ex.Message}");
            return false;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Unexpected error: {ex.Message}");
            return false;
        }
    }

    public string GetKey() => _configuration["Jwt:Key"];
    public string GetIssuer() => _configuration["Jwt:Issuer"];
    public string GetAudience() => _configuration["Jwt:Audience"];
}
