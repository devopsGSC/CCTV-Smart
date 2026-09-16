namespace SistemaCctv.Api.Data;

public class RelationInfo
{
    public required string TargetTable { get; init; }
    public required string FkColumn { get; init; } // column on THIS table, e.g. "cliente_id"
}

public class ManyToManyInfo
{
    public required string JoinTable { get; init; }
    public required string SelfColumn { get; init; }   // column on join table pointing back to this collection
    public required string OtherColumn { get; init; }  // column on join table pointing to target
    public required string TargetTable { get; init; }
}

public class CollectionConfig
{
    public required string Table { get; init; }

    // frontend field name -> actual db column name (only for names that differ, e.g. relations)
    public Dictionary<string, string> FieldToColumn { get; init; } = new();

    // db column name -> frontend field name (reverse of FieldToColumn, auto-built)
    public Dictionary<string, string> ColumnToField { get; init; } = new();

    // writable scalar/text/number/bool columns (frontend field names), excludes id/created/updated/relations/json/m2m
    public List<string> WritableFields { get; init; } = new();

    // frontend field name -> db column (json columns stored as NVARCHAR(MAX))
    public List<string> JsonFields { get; init; } = new();

    // frontend field name -> relation info (single relation, *_id column)
    public Dictionary<string, RelationInfo> Relations { get; init; } = new();

    // frontend field name -> many-to-many info
    public Dictionary<string, ManyToManyInfo> ManyToMany { get; init; } = new();

    public string DefaultSort { get; init; } = "-created";

    // fields never returned to the client (e.g. password_hash)
    public List<string> Hidden { get; init; } = new();

    public string Column(string field) => FieldToColumn.TryGetValue(field, out var c) ? c : field;
    public string Field(string column) => ColumnToField.TryGetValue(column, out var f) ? f : column;
}

public static class CollectionRegistry
{
    public static readonly Dictionary<string, CollectionConfig> All = new(StringComparer.OrdinalIgnoreCase)
    {
        ["clientes"] = new CollectionConfig
        {
            Table = "clientes",
            WritableFields = new() { "codigo", "nombre", "dependencia", "contacto", "cargo", "telefono", "correo", "observaciones", "demo" },
        },
        ["lugares"] = new CollectionConfig
        {
            Table = "lugares",
            WritableFields = new() { "codigo", "nombre", "tipo", "direccion", "municipio", "departamento", "responsable", "cargo", "telefono", "correo", "observaciones", "demo" },
            Relations = new() { ["cliente"] = new RelationInfo { TargetTable = "clientes", FkColumn = "cliente_id" } },
            FieldToColumn = new() { ["cliente"] = "cliente_id" },
        },
        ["tecnicos"] = new CollectionConfig
        {
            Table = "tecnicos",
            WritableFields = new() { "codigo", "nombre", "cargo", "especialidad", "telefono", "correo", "activo", "demo" },
        },
        ["equipos"] = new CollectionConfig
        {
            Table = "equipos",
            WritableFields = new() { "tipo", "marca", "modelo", "serie", "ip", "ubicacion", "estado", "observaciones", "demo" },
            Relations = new() { ["lugar"] = new RelationInfo { TargetTable = "lugares", FkColumn = "lugar_id" } },
            FieldToColumn = new() { ["lugar"] = "lugar_id" },
        },
        ["catalogo"] = new CollectionConfig
        {
            Table = "catalogo",
            WritableFields = new() { "codigo", "categoria", "subcategoria", "descripcion", "marca", "modelo", "unidad", "precio", "iva", "activo", "demo" },
        },
        ["ordenes"] = new CollectionConfig
        {
            Table = "ordenes",
            WritableFields = new() {
                "numero", "fechaCreacion", "fechaProgramada", "horaProgramada", "horaLlegada", "horaFinalizacion",
                "tipoVisita", "prioridad", "estado", "demo",
            },
            JsonFields = new() { "motivo", "equipos", "checklist", "correctivo", "materiales", "requeridos", "fotos", "cierre", "firmas", "cotizacion", "corrMateriales" },
            Relations = new()
            {
                ["cliente"] = new RelationInfo { TargetTable = "clientes", FkColumn = "cliente_id" },
                ["lugar"] = new RelationInfo { TargetTable = "lugares", FkColumn = "lugar_id" },
                ["tecnico"] = new RelationInfo { TargetTable = "tecnicos", FkColumn = "tecnico_id" },
                ["creadoPor"] = new RelationInfo { TargetTable = "users", FkColumn = "creadoPor_id" },
            },
            ManyToMany = new()
            {
                ["auxiliares"] = new ManyToManyInfo { JoinTable = "ordenes_auxiliares", SelfColumn = "orden_id", OtherColumn = "tecnico_id", TargetTable = "tecnicos" },
            },
            FieldToColumn = new() { ["cliente"] = "cliente_id", ["lugar"] = "lugar_id", ["tecnico"] = "tecnico_id", ["creadoPor"] = "creadoPor_id" },
        },
        ["cartas"] = new CollectionConfig
        {
            Table = "cartas",
            WritableFields = new() { "numero", "version", "fecha", "diagnostico", "justificacion", "descuento", "ivaPorcentaje", "estado", "demo" },
            JsonFields = new() { "items", "condiciones", "aprobacion" },
            Relations = new()
            {
                ["orden"] = new RelationInfo { TargetTable = "ordenes", FkColumn = "orden_id" },
                ["cliente"] = new RelationInfo { TargetTable = "clientes", FkColumn = "cliente_id" },
                ["lugar"] = new RelationInfo { TargetTable = "lugares", FkColumn = "lugar_id" },
                ["creadoPor"] = new RelationInfo { TargetTable = "users", FkColumn = "creadoPor_id" },
            },
            FieldToColumn = new() { ["orden"] = "orden_id", ["cliente"] = "cliente_id", ["lugar"] = "lugar_id", ["creadoPor"] = "creadoPor_id" },
        },
        ["configuracion"] = new CollectionConfig
        {
            Table = "configuracion",
            WritableFields = new() { "clave" },
            JsonFields = new() { "valor" },
        },
        ["users"] = new CollectionConfig
        {
            Table = "users",
            WritableFields = new() { "email", "name", "role", "activo", "verified" },
            Hidden = new() { "password_hash" },
        },
    };

    static CollectionRegistry()
    {
        foreach (var cfg in All.Values)
        {
            foreach (var (field, column) in cfg.FieldToColumn)
                cfg.ColumnToField[column] = field;
        }
    }
}
