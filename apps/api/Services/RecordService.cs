using System.Data;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Dapper;
using Microsoft.Data.SqlClient;
using SistemaCctv.Api.Data;

namespace SistemaCctv.Api.Services;

public class ListResult
{
    public List<JsonObject> Items { get; set; } = new();
    public int Page { get; set; }
    public int PerPage { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}

public class RecordService
{
    private readonly string _connectionString;

    public RecordService(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("Default")!;
    }

    private SqlConnection Open() => new SqlConnection(_connectionString);

    public static CollectionConfig? Resolve(string name) =>
        CollectionRegistry.All.TryGetValue(name, out var cfg) ? cfg : null;

    private static readonly Regex FilterRegex = new(
        "^(?<field>[A-Za-z_][A-Za-z0-9_]*)\\s*(?<op>=|~)\\s*(?:\"(?<sval>[^\"]*)\"|(?<bval>true|false))$",
        RegexOptions.Compiled);

    private (string sql, object? param) BuildWhere(CollectionConfig cfg, string? filter)
    {
        if (string.IsNullOrWhiteSpace(filter)) return ("", null);
        var m = FilterRegex.Match(filter.Trim());
        if (!m.Success) return ("", null);

        var field = m.Groups["field"].Value;
        var column = cfg.Column(field);
        var op = m.Groups["op"].Value;

        if (m.Groups["bval"].Success)
        {
            var bval = m.Groups["bval"].Value == "true";
            return ($"WHERE [{column}] = @fval", new { fval = bval });
        }

        var sval = m.Groups["sval"].Value;
        if (op == "~")
        {
            return ($"WHERE [{column}] LIKE @fval", new { fval = $"%{sval}%" });
        }

        // relation filters compare against the record id (int); everything else is text
        if (cfg.Relations.ContainsKey(field) && int.TryParse(sval, out var relId))
            return ($"WHERE [{column}] = @fval", new { fval = relId });

        return ($"WHERE [{column}] = @fval", new { fval = sval });
    }

    private static string BuildOrderBy(CollectionConfig cfg, string? sort)
    {
        if (string.IsNullOrWhiteSpace(sort)) sort = cfg.DefaultSort;
        var parts = sort.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var clauses = new List<string>();
        foreach (var p in parts)
        {
            var desc = p.StartsWith('-');
            var field = desc ? p[1..] : p;
            var column = field is "created" or "updated" or "id" ? field : cfg.Column(field);
            clauses.Add($"[{column}] {(desc ? "DESC" : "ASC")}");
        }
        return clauses.Count == 0 ? "[created] DESC" : string.Join(", ", clauses);
    }

    private JsonObject RowToJson(string collectionName, CollectionConfig cfg, IDictionary<string, object> row)
    {
        var obj = new JsonObject();
        foreach (var (column, rawValue) in row)
        {
            if (cfg.Hidden.Contains(column)) continue;

            var field = cfg.Field(column);

            if (rawValue is null || rawValue is DBNull)
            {
                if (cfg.Relations.ContainsKey(field)) obj[field] = "";
                else if (cfg.JsonFields.Contains(field)) obj[field] = null;
                else obj[field] = null;
                continue;
            }

            if (column == "id")
            {
                obj["id"] = rawValue.ToString();
                continue;
            }

            if (cfg.Relations.ContainsKey(field))
            {
                obj[field] = rawValue.ToString();
                continue;
            }

            if (column is "created" or "updated" && rawValue is DateTime dt)
            {
                obj[field] = dt.ToString("o");
                continue;
            }

            if (cfg.JsonFields.Contains(field))
            {
                var text = rawValue.ToString();
                obj[field] = string.IsNullOrWhiteSpace(text) ? null : JsonNode.Parse(text);
                continue;
            }

            obj[field] = rawValue switch
            {
                bool b => JsonValue.Create(b),
                int i => JsonValue.Create(i),
                long l => JsonValue.Create(l),
                decimal de => JsonValue.Create(de),
                double d => JsonValue.Create(d),
                DateTime d2 => JsonValue.Create(d2.ToString("o")),
                _ => JsonValue.Create(rawValue.ToString()),
            };
        }

        obj["collectionName"] = collectionName;
        return obj;
    }

    private async Task AttachManyToMany(SqlConnection conn, string collectionName, CollectionConfig cfg, List<(int Id, JsonObject Json)> rows)
    {
        foreach (var (fieldName, m2m) in cfg.ManyToMany)
        {
            var ids = rows.Select(r => r.Id).ToList();
            if (ids.Count == 0) continue;

            var sql = $"SELECT [{m2m.SelfColumn}] AS SelfId, [{m2m.OtherColumn}] AS OtherId FROM [{m2m.JoinTable}] WHERE [{m2m.SelfColumn}] IN @ids";
            var links = (await conn.QueryAsync<(int SelfId, int OtherId)>(sql, new { ids })).ToList();
            var grouped = links.GroupBy(l => l.SelfId).ToDictionary(g => g.Key, g => g.Select(l => l.OtherId).ToList());

            foreach (var (id, json) in rows)
            {
                var otherIds = grouped.TryGetValue(id, out var list) ? list : new List<int>();
                var arr = new JsonArray();
                foreach (var oid in otherIds) arr.Add(oid.ToString());
                json[fieldName] = arr;
            }
        }
    }

    private async Task AttachExpand(SqlConnection conn, CollectionConfig cfg, List<(int Id, JsonObject Json)> rows, string? expand)
    {
        if (string.IsNullOrWhiteSpace(expand) || rows.Count == 0) return;
        var fields = expand.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var field in fields)
        {
            if (cfg.Relations.TryGetValue(field, out var rel))
            {
                var ids = rows
                    .Select(r => r.Json[field]?.GetValue<string>())
                    .Where(v => !string.IsNullOrEmpty(v))
                    .Select(v => int.Parse(v!))
                    .Distinct()
                    .ToList();
                if (ids.Count == 0) continue;

                var targetCfg = Resolve(rel.TargetTable)!;
                var targetRows = await conn.QueryAsync(
                    $"SELECT * FROM [{rel.TargetTable}] WHERE [id] IN @ids", new { ids });
                var lookup = targetRows
                    .Select(r => (IDictionary<string, object>)r)
                    .ToDictionary(r => Convert.ToInt32(r["id"]), r => RowToJson(rel.TargetTable, targetCfg, r));

                foreach (var (_, json) in rows)
                {
                    var idStr = json[field]?.GetValue<string>();
                    if (!string.IsNullOrEmpty(idStr) && lookup.TryGetValue(int.Parse(idStr), out var expanded))
                    {
                        json["expand"] ??= new JsonObject();
                        ((JsonObject)json["expand"]!)[field] = JsonNode.Parse(expanded.ToJsonString());
                    }
                }
            }
            else if (cfg.ManyToMany.TryGetValue(field, out var m2m))
            {
                var allIds = rows
                    .SelectMany(r => (r.Json[field] as JsonArray)?.Select(x => x!.GetValue<string>()) ?? Enumerable.Empty<string>())
                    .Select(int.Parse)
                    .Distinct()
                    .ToList();
                if (allIds.Count == 0) continue;

                var targetCfg = Resolve(m2m.TargetTable)!;
                var targetRows = await conn.QueryAsync(
                    $"SELECT * FROM [{m2m.TargetTable}] WHERE [id] IN @allIds", new { allIds });
                var lookup = targetRows
                    .Select(r => (IDictionary<string, object>)r)
                    .ToDictionary(r => Convert.ToInt32(r["id"]), r => RowToJson(m2m.TargetTable, targetCfg, r));

                foreach (var (_, json) in rows)
                {
                    var idList = (json[field] as JsonArray)?.Select(x => int.Parse(x!.GetValue<string>())).ToList() ?? new();
                    var arr = new JsonArray();
                    foreach (var oid in idList)
                        if (lookup.TryGetValue(oid, out var expanded))
                            arr.Add(JsonNode.Parse(expanded.ToJsonString()));
                    json["expand"] ??= new JsonObject();
                    ((JsonObject)json["expand"]!)[field] = arr;
                }
            }
        }
    }

    public async Task<ListResult> ListAsync(string collectionName, CollectionConfig cfg, int page, int perPage, string? sort, string? filter, string? expand)
    {
        using var conn = Open();
        await conn.OpenAsync();

        var (whereSql, whereParam) = BuildWhere(cfg, filter);
        var orderBy = BuildOrderBy(cfg, sort);

        var countSql = $"SELECT COUNT(*) FROM [{cfg.Table}] {whereSql}";
        var total = await conn.ExecuteScalarAsync<int>(countSql, whereParam);

        var offset = (Math.Max(page, 1) - 1) * perPage;
        var listSql = $"SELECT * FROM [{cfg.Table}] {whereSql} ORDER BY {orderBy} OFFSET {offset} ROWS FETCH NEXT {perPage} ROWS ONLY";
        var dynRows = await conn.QueryAsync(listSql, whereParam);

        var rows = dynRows.Select(r => (IDictionary<string, object>)r).ToList();
        var jsonRows = rows.Select(r => (Id: Convert.ToInt32(r["id"]), Json: RowToJson(collectionName, cfg, r))).ToList();

        await AttachManyToMany(conn, collectionName, cfg, jsonRows);
        await AttachExpand(conn, cfg, jsonRows, expand);

        return new ListResult
        {
            Items = jsonRows.Select(r => r.Json).ToList(),
            Page = page,
            PerPage = perPage,
            TotalItems = total,
            TotalPages = (int)Math.Ceiling(total / (double)perPage),
        };
    }

    public async Task<JsonObject?> GetOneAsync(string collectionName, CollectionConfig cfg, int id, string? expand)
    {
        using var conn = Open();
        await conn.OpenAsync();

        var row = (await conn.QueryAsync($"SELECT * FROM [{cfg.Table}] WHERE [id] = @id", new { id }))
            .Select(r => (IDictionary<string, object>)r)
            .FirstOrDefault();
        if (row is null) return null;

        var json = RowToJson(collectionName, cfg, row);
        var single = new List<(int Id, JsonObject Json)> { (id, json) };
        await AttachManyToMany(conn, collectionName, cfg, single);
        await AttachExpand(conn, cfg, single, expand);
        return json;
    }

    private object? CoerceValue(JsonNode? node)
    {
        if (node is null) return null;
        return node switch
        {
            JsonValue v when v.TryGetValue<bool>(out var b) => b,
            JsonValue v when v.TryGetValue<long>(out var l) => l,
            JsonValue v when v.TryGetValue<double>(out var d) => d,
            JsonValue v when v.TryGetValue<string>(out var s) => s,
            _ => null,
        };
    }

    public async Task<int> CreateAsync(string collectionName, CollectionConfig cfg, JsonObject body)
    {
        using var conn = Open();
        await conn.OpenAsync();

        var columns = new List<string>();
        var paramNames = new List<string>();
        var parameters = new DynamicParameters();
        var m2mToApply = new List<(ManyToManyInfo m2m, List<int> ids)>();

        foreach (var (key, value) in body)
        {
            if (key is "id" or "created" or "updated" or "collectionName" or "expand") continue;

            if (cfg.JsonFields.Contains(key))
            {
                columns.Add(key); paramNames.Add("@" + key);
                parameters.Add(key, value?.ToJsonString());
                continue;
            }

            if (cfg.Relations.TryGetValue(key, out var rel))
            {
                var col = cfg.Column(key);
                var idStr = value?.GetValue<string>();
                columns.Add(col); paramNames.Add("@" + col);
                parameters.Add(col, string.IsNullOrEmpty(idStr) ? null : int.Parse(idStr));
                continue;
            }

            if (cfg.ManyToMany.TryGetValue(key, out var m2m))
            {
                var ids = (value as JsonArray)?.Select(x => int.Parse(x!.GetValue<string>())).ToList() ?? new();
                m2mToApply.Add((m2m, ids));
                continue;
            }

            if (key == "password" && collectionName.Equals("users", StringComparison.OrdinalIgnoreCase))
            {
                columns.Add("password_hash"); paramNames.Add("@password_hash");
                parameters.Add("password_hash", BCrypt.Net.BCrypt.HashPassword(value!.GetValue<string>()));
                continue;
            }
            if (key is "passwordConfirm") continue;

            if (cfg.WritableFields.Contains(key))
            {
                columns.Add(key); paramNames.Add("@" + key);
                parameters.Add(key, CoerceValue(value));
                continue;
            }
        }

        columns.Add("created"); paramNames.Add("SYSUTCDATETIME()");
        columns.Add("updated"); paramNames.Add("SYSUTCDATETIME()");

        var sql = $"INSERT INTO [{cfg.Table}] ({string.Join(",", columns.Select(c => $"[{c}]"))}) " +
                  $"OUTPUT INSERTED.id VALUES ({string.Join(",", paramNames)})";

        var newId = await conn.ExecuteScalarAsync<int>(sql, parameters);

        foreach (var (m2m, ids) in m2mToApply)
        {
            foreach (var oid in ids)
                await conn.ExecuteAsync(
                    $"INSERT INTO [{m2m.JoinTable}] ([{m2m.SelfColumn}],[{m2m.OtherColumn}]) VALUES (@self,@other)",
                    new { self = newId, other = oid });
        }

        return newId;
    }

    public async Task<bool> UpdateAsync(string collectionName, CollectionConfig cfg, int id, JsonObject body)
    {
        using var conn = Open();
        await conn.OpenAsync();

        var sets = new List<string>();
        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        var m2mToApply = new List<(ManyToManyInfo m2m, List<int> ids)>();

        foreach (var (key, value) in body)
        {
            if (key is "id" or "created" or "updated" or "collectionName" or "expand") continue;

            if (cfg.JsonFields.Contains(key))
            {
                sets.Add($"[{key}] = @{key}");
                parameters.Add(key, value?.ToJsonString());
                continue;
            }

            if (cfg.Relations.TryGetValue(key, out var rel))
            {
                var col = cfg.Column(key);
                var idStr = value?.GetValue<string>();
                sets.Add($"[{col}] = @{col}");
                parameters.Add(col, string.IsNullOrEmpty(idStr) ? null : int.Parse(idStr));
                continue;
            }

            if (cfg.ManyToMany.TryGetValue(key, out var m2m))
            {
                var ids = (value as JsonArray)?.Select(x => int.Parse(x!.GetValue<string>())).ToList() ?? new();
                m2mToApply.Add((m2m, ids));
                continue;
            }

            if (key == "password" && collectionName.Equals("users", StringComparison.OrdinalIgnoreCase))
            {
                sets.Add("[password_hash] = @password_hash");
                parameters.Add("password_hash", BCrypt.Net.BCrypt.HashPassword(value!.GetValue<string>()));
                continue;
            }
            if (key is "passwordConfirm" or "oldPassword") continue;

            if (cfg.WritableFields.Contains(key))
            {
                sets.Add($"[{key}] = @{key}");
                parameters.Add(key, CoerceValue(value));
                continue;
            }
        }

        sets.Add("[updated] = SYSUTCDATETIME()");

        if (sets.Count > 0)
        {
            var sql = $"UPDATE [{cfg.Table}] SET {string.Join(",", sets)} WHERE [id] = @id";
            await conn.ExecuteAsync(sql, parameters);
        }

        foreach (var (m2m, ids) in m2mToApply)
        {
            await conn.ExecuteAsync($"DELETE FROM [{m2m.JoinTable}] WHERE [{m2m.SelfColumn}] = @id", new { id });
            foreach (var oid in ids)
                await conn.ExecuteAsync(
                    $"INSERT INTO [{m2m.JoinTable}] ([{m2m.SelfColumn}],[{m2m.OtherColumn}]) VALUES (@self,@other)",
                    new { self = id, other = oid });
        }

        return true;
    }

    public async Task<bool> DeleteAsync(CollectionConfig cfg, int id)
    {
        using var conn = Open();
        await conn.OpenAsync();
        var affected = await conn.ExecuteAsync($"DELETE FROM [{cfg.Table}] WHERE [id] = @id", new { id });
        return affected > 0;
    }
}
