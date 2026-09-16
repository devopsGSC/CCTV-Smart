using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SistemaCctv.Api.Data;
using SistemaCctv.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<RecordService>();
builder.Services.AddScoped<JwtTokenService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
        };
    });

builder.Services.AddAuthorization();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number is 2627 or 2601)
    {
        context.Response.StatusCode = 400;
        await context.Response.WriteAsJsonAsync(new { message = "Ya existe un registro con ese valor único (numero/correo/clave duplicado).", status = 400 });
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new { message = ex.Message, status = 500 });
    }
});

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
