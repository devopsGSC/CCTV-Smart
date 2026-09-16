using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SistemaCctv.Api.Models;

public abstract class Timestamped
{
    public DateTime Created { get; set; }
    public DateTime Updated { get; set; }
}

[Table("users")]
public class UserEntity : Timestamped
{
    public int Id { get; set; }
    [Required] public string Email { get; set; } = "";
    [Column("password_hash")] public string PasswordHash { get; set; } = "";
    public string? Name { get; set; }
    public string Role { get; set; } = "Usuario";
    public bool Activo { get; set; } = true;
    public bool Verified { get; set; }
}

[Table("clientes")]
public class ClienteEntity : Timestamped
{
    public int Id { get; set; }
    public string? Codigo { get; set; }
    [Required] public string Nombre { get; set; } = "";
    public string? Dependencia { get; set; }
    public string? Contacto { get; set; }
    public string? Cargo { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? Observaciones { get; set; }
    public bool Demo { get; set; }
}

[Table("lugares")]
public class LugarEntity : Timestamped
{
    public int Id { get; set; }
    public string? Codigo { get; set; }
    [Column("cliente_id")] public int? ClienteId { get; set; }
    [Required] public string Nombre { get; set; } = "";
    public string? Tipo { get; set; }
    public string? Direccion { get; set; }
    public string? Municipio { get; set; }
    public string? Departamento { get; set; }
    public string? Responsable { get; set; }
    public string? Cargo { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? Observaciones { get; set; }
    public bool Demo { get; set; }

    public ClienteEntity? Cliente { get; set; }
}

[Table("tecnicos")]
public class TecnicoEntity : Timestamped
{
    public int Id { get; set; }
    public string? Codigo { get; set; }
    [Required] public string Nombre { get; set; } = "";
    public string? Cargo { get; set; }
    public string? Especialidad { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public bool Activo { get; set; } = true;
    public bool Demo { get; set; }
}

[Table("equipos")]
public class EquipoEntity : Timestamped
{
    public int Id { get; set; }
    [Column("lugar_id")] public int? LugarId { get; set; }
    public string? Tipo { get; set; }
    public string? Marca { get; set; }
    public string? Modelo { get; set; }
    public string? Serie { get; set; }
    public string? Ip { get; set; }
    public string? Ubicacion { get; set; }
    public string? Estado { get; set; }
    public string? Observaciones { get; set; }
    public bool Demo { get; set; }

    public LugarEntity? Lugar { get; set; }
}

[Table("catalogo")]
public class CatalogoEntity : Timestamped
{
    public int Id { get; set; }
    public string? Codigo { get; set; }
    public string? Categoria { get; set; }
    public string? Subcategoria { get; set; }
    [Required] public string Descripcion { get; set; } = "";
    public string? Marca { get; set; }
    public string? Modelo { get; set; }
    public string? Unidad { get; set; }
    public decimal? Precio { get; set; }
    public bool Iva { get; set; }
    public bool Activo { get; set; } = true;
    public bool Demo { get; set; }
}

[Table("ordenes")]
public class OrdenEntity : Timestamped
{
    public int Id { get; set; }
    [Required] public string Numero { get; set; } = "";
    [Column("fechaCreacion")] public string? FechaCreacion { get; set; }
    [Column("fechaProgramada")] public string? FechaProgramada { get; set; }
    [Column("horaProgramada")] public string? HoraProgramada { get; set; }
    [Column("horaLlegada")] public string? HoraLlegada { get; set; }
    [Column("horaFinalizacion")] public string? HoraFinalizacion { get; set; }

    [Column("cliente_id")] public int? ClienteId { get; set; }
    [Column("lugar_id")] public int? LugarId { get; set; }
    [Column("tecnico_id")] public int? TecnicoId { get; set; }
    [Column("creadoPor_id")] public int? CreadoPorId { get; set; }

    [Column("tipoVisita")] public string? TipoVisita { get; set; }
    public string? Prioridad { get; set; }
    public string? Estado { get; set; }

    public string? Motivo { get; set; }
    public string? Equipos { get; set; }
    public string? Checklist { get; set; }
    public string? Correctivo { get; set; }
    public string? Materiales { get; set; }
    public string? Requeridos { get; set; }
    public string? Fotos { get; set; }
    public string? Cierre { get; set; }
    public string? Firmas { get; set; }
    public string? Cotizacion { get; set; }
    [Column("corrMateriales")] public string? CorrMateriales { get; set; }

    public bool Demo { get; set; }

    public ClienteEntity? Cliente { get; set; }
    public LugarEntity? Lugar { get; set; }
    public TecnicoEntity? Tecnico { get; set; }
    public UserEntity? CreadoPor { get; set; }
    public List<OrdenAuxiliarEntity> Auxiliares { get; set; } = new();
}

[Table("ordenes_auxiliares")]
public class OrdenAuxiliarEntity
{
    [Column("orden_id")] public int OrdenId { get; set; }
    [Column("tecnico_id")] public int TecnicoId { get; set; }

    public OrdenEntity? Orden { get; set; }
    public TecnicoEntity? Tecnico { get; set; }
}

[Table("cartas")]
public class CartaEntity : Timestamped
{
    public int Id { get; set; }
    [Required] public string Numero { get; set; } = "";
    public int? Version { get; set; }

    [Column("orden_id")] public int? OrdenId { get; set; }
    [Column("cliente_id")] public int? ClienteId { get; set; }
    [Column("lugar_id")] public int? LugarId { get; set; }
    [Column("creadoPor_id")] public int? CreadoPorId { get; set; }

    public string? Fecha { get; set; }
    public string? Diagnostico { get; set; }
    public string? Justificacion { get; set; }
    public string? Items { get; set; }
    public decimal? Descuento { get; set; }
    [Column("ivaPorcentaje")] public decimal? IvaPorcentaje { get; set; }
    public string? Estado { get; set; }
    public string? Condiciones { get; set; }
    public string? Aprobacion { get; set; }
    public bool Demo { get; set; }

    public OrdenEntity? Orden { get; set; }
    public ClienteEntity? Cliente { get; set; }
    public LugarEntity? Lugar { get; set; }
    public UserEntity? CreadoPor { get; set; }
}

[Table("configuracion")]
public class ConfiguracionEntity : Timestamped
{
    public int Id { get; set; }
    [Required] public string Clave { get; set; } = "";
    public string? Valor { get; set; }
}
