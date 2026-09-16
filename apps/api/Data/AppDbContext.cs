using Microsoft.EntityFrameworkCore;
using SistemaCctv.Api.Models;

namespace SistemaCctv.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();
    public DbSet<LugarEntity> Lugares => Set<LugarEntity>();
    public DbSet<TecnicoEntity> Tecnicos => Set<TecnicoEntity>();
    public DbSet<EquipoEntity> Equipos => Set<EquipoEntity>();
    public DbSet<CatalogoEntity> Catalogo => Set<CatalogoEntity>();
    public DbSet<OrdenEntity> Ordenes => Set<OrdenEntity>();
    public DbSet<OrdenAuxiliarEntity> OrdenesAuxiliares => Set<OrdenAuxiliarEntity>();
    public DbSet<CartaEntity> Cartas => Set<CartaEntity>();
    public DbSet<ConfiguracionEntity> Configuracion => Set<ConfiguracionEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LugarEntity>()
            .HasOne(l => l.Cliente)
            .WithMany()
            .HasForeignKey(l => l.ClienteId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<EquipoEntity>()
            .HasOne(e => e.Lugar)
            .WithMany()
            .HasForeignKey(e => e.LugarId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<OrdenEntity>()
            .HasOne(o => o.Cliente)
            .WithMany()
            .HasForeignKey(o => o.ClienteId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<OrdenEntity>()
            .HasOne(o => o.Lugar)
            .WithMany()
            .HasForeignKey(o => o.LugarId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<OrdenEntity>()
            .HasOne(o => o.Tecnico)
            .WithMany()
            .HasForeignKey(o => o.TecnicoId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<OrdenEntity>()
            .HasOne(o => o.CreadoPor)
            .WithMany()
            .HasForeignKey(o => o.CreadoPorId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<OrdenAuxiliarEntity>()
            .HasKey(oa => new { oa.OrdenId, oa.TecnicoId });

        modelBuilder.Entity<OrdenAuxiliarEntity>()
            .HasOne(oa => oa.Orden)
            .WithMany(o => o.Auxiliares)
            .HasForeignKey(oa => oa.OrdenId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrdenAuxiliarEntity>()
            .HasOne(oa => oa.Tecnico)
            .WithMany()
            .HasForeignKey(oa => oa.TecnicoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CartaEntity>()
            .HasOne(c => c.Orden)
            .WithMany()
            .HasForeignKey(c => c.OrdenId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<CartaEntity>()
            .HasOne(c => c.Cliente)
            .WithMany()
            .HasForeignKey(c => c.ClienteId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<CartaEntity>()
            .HasOne(c => c.Lugar)
            .WithMany()
            .HasForeignKey(c => c.LugarId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<CartaEntity>()
            .HasOne(c => c.CreadoPor)
            .WithMany()
            .HasForeignKey(c => c.CreadoPorId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<UserEntity>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<OrdenEntity>().HasIndex(o => o.Numero).IsUnique();
        modelBuilder.Entity<CartaEntity>().HasIndex(c => c.Numero).IsUnique();
        modelBuilder.Entity<ConfiguracionEntity>().HasIndex(c => c.Clave).IsUnique();
    }
}
