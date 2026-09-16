using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaCctv.Api.Data;
using SistemaCctv.Api.Models;
using SistemaCctv.Api.Services;

namespace SistemaCctv.Api.Controllers;

public record LoginRequest(string Email, string Password);

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _jwt;

    public AuthController(AppDbContext db, JwtTokenService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    private static object ToRecord(UserEntity u) => new
    {
        id = u.Id.ToString(),
        email = u.Email,
        name = u.Name,
        role = u.Role,
        activo = u.Activo,
        verified = u.Verified,
        created = u.Created.ToString("o"),
        updated = u.Updated.ToString("o"),
        collectionName = "users",
    };

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return BadRequest(new { message = "Failed to authenticate.", status = 400 });

        var token = _jwt.CreateToken(user);
        return Ok(new { token, record = ToRecord(user) });
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> Me()
    {
        var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (idClaim is null || !int.TryParse(idClaim, out var id)) return Unauthorized();
        var user = await _db.Users.FindAsync(id);
        if (user is null) return Unauthorized();
        return Ok(new { record = ToRecord(user) });
    }
}
