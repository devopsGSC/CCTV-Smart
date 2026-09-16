using System.Security.Claims;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaCctv.Api.Data;
using SistemaCctv.Api.Services;

namespace SistemaCctv.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/collections/{name}/records")]
public class CollectionsController : ControllerBase
{
    private readonly RecordService _records;

    public CollectionsController(RecordService records)
    {
        _records = records;
    }

    private int CurrentUserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private bool IsAdmin => User.FindFirst(ClaimTypes.Role)?.Value == "Admin";
    private static bool IsOwned(string name) => name is "ordenes" or "cartas";

    [HttpGet]
    public async Task<IActionResult> List(string name, [FromQuery] int page = 1, [FromQuery] int perPage = 200,
        [FromQuery] string? sort = null, [FromQuery] string? filter = null, [FromQuery] string? expand = null)
    {
        var cfg = RecordService.Resolve(name);
        if (cfg is null) return NotFound();

        if (name.Equals("users", StringComparison.OrdinalIgnoreCase) && !IsAdmin)
            filter = $"id = \"{CurrentUserId}\"";

        var result = await _records.ListAsync(name, cfg, page, perPage, sort, filter, expand);

        if (IsOwned(name) && !IsAdmin)
        {
            result.Items = result.Items.Where(i => i["creadoPor"]?.GetValue<string>() == CurrentUserId.ToString()).ToList();
            result.TotalItems = result.Items.Count;
        }

        return Ok(new
        {
            page = result.Page,
            perPage = result.PerPage,
            totalItems = result.TotalItems,
            totalPages = result.TotalPages,
            items = result.Items,
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOne(string name, string id, [FromQuery] string? expand = null)
    {
        var cfg = RecordService.Resolve(name);
        if (cfg is null || !int.TryParse(id, out var intId)) return NotFound();

        var record = await _records.GetOneAsync(name, cfg, intId, expand);
        if (record is null) return NotFound();

        if (name.Equals("users", StringComparison.OrdinalIgnoreCase) && !IsAdmin && intId != CurrentUserId)
            return Forbid();

        if (IsOwned(name) && !IsAdmin && record["creadoPor"]?.GetValue<string>() != CurrentUserId.ToString())
            return Forbid();

        return Ok(record);
    }

    [HttpPost]
    public async Task<IActionResult> Create(string name, [FromBody] JsonObject body)
    {
        var cfg = RecordService.Resolve(name);
        if (cfg is null) return NotFound();

        if (name.Equals("users", StringComparison.OrdinalIgnoreCase) && !IsAdmin)
            return Forbid();

        if (IsOwned(name))
            body["creadoPor"] = CurrentUserId.ToString();

        var newId = await _records.CreateAsync(name, cfg, body);
        var record = await _records.GetOneAsync(name, cfg, newId, null);
        return CreatedAtAction(nameof(GetOne), new { name, id = newId.ToString() }, record);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string name, string id, [FromBody] JsonObject body)
    {
        var cfg = RecordService.Resolve(name);
        if (cfg is null || !int.TryParse(id, out var intId)) return NotFound();

        var existing = await _records.GetOneAsync(name, cfg, intId, null);
        if (existing is null) return NotFound();

        if (name.Equals("users", StringComparison.OrdinalIgnoreCase) && !IsAdmin && intId != CurrentUserId)
            return Forbid();

        if (IsOwned(name) && !IsAdmin && existing["creadoPor"]?.GetValue<string>() != CurrentUserId.ToString())
            return Forbid();

        if (name.Equals("users", StringComparison.OrdinalIgnoreCase) && !IsAdmin)
        {
            body.Remove("role");
            body.Remove("activo");
        }

        await _records.UpdateAsync(name, cfg, intId, body);
        var record = await _records.GetOneAsync(name, cfg, intId, null);
        return Ok(record);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string name, string id)
    {
        var cfg = RecordService.Resolve(name);
        if (cfg is null || !int.TryParse(id, out var intId)) return NotFound();

        var existing = await _records.GetOneAsync(name, cfg, intId, null);
        if (existing is null) return NotFound();

        if (name.Equals("users", StringComparison.OrdinalIgnoreCase) && !IsAdmin)
            return Forbid();

        if (IsOwned(name) && !IsAdmin && existing["creadoPor"]?.GetValue<string>() != CurrentUserId.ToString())
            return Forbid();

        await _records.DeleteAsync(cfg, intId);
        return NoContent();
    }
}
