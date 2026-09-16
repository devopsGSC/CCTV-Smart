/*
    Sistema CCTV - Esquema SQL Server
    ----------------------------------
    Equivalente a las colecciones de PocketBase definidas en:
      apps/pocketbase/pb_migrations/1786470800_create_cctv_system.js
      apps/pocketbase/pb_migrations/1786471928_add_cotizacion_to_ordenes.js
      apps/pocketbase/pb_migrations/1786473134_add_corrMateriales_to_ordenes.js
      apps/pocketbase/pb_migrations/1786487873_auth_roles_andOwnership.js

    Motor objetivo: Microsoft SQL Server 2016+ (usa NVARCHAR(MAX) + ISJSON
    para las columnas que en PocketBase eran de tipo "json").

    Ejecutar con sqlcmd o SSMS. Ajusta el nombre de la base si lo necesitas.
*/

IF DB_ID(N'SistemaCCTV') IS NULL
BEGIN
    CREATE DATABASE SistemaCCTV;
END
GO

USE SistemaCCTV;
GO

-- ============================================================
-- users  (reemplaza la colección auth "users" de PocketBase)
-- ============================================================
IF OBJECT_ID(N'dbo.users', N'U') IS NULL
CREATE TABLE dbo.users (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    email           NVARCHAR(255)   NOT NULL,
    password_hash   NVARCHAR(255)   NOT NULL,      -- hash bcrypt/argon2 generado por la API, nunca texto plano
    name            NVARCHAR(200)   NULL,
    role            NVARCHAR(20)    NOT NULL CONSTRAINT DF_users_role DEFAULT ('Usuario'),
    activo          BIT             NOT NULL CONSTRAINT DF_users_activo DEFAULT (1),
    verified        BIT             NOT NULL CONSTRAINT DF_users_verified DEFAULT (0),
    created         DATETIME2       NOT NULL CONSTRAINT DF_users_created DEFAULT (SYSUTCDATETIME()),
    updated         DATETIME2       NOT NULL CONSTRAINT DF_users_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT CK_users_role CHECK (role IN ('Admin', 'Usuario'))
);
GO

-- ============================================================
-- clientes
-- ============================================================
IF OBJECT_ID(N'dbo.clientes', N'U') IS NULL
CREATE TABLE dbo.clientes (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    codigo          NVARCHAR(40)    NULL,
    nombre          NVARCHAR(200)   NOT NULL,
    dependencia     NVARCHAR(200)   NULL,
    contacto        NVARCHAR(150)   NULL,
    cargo           NVARCHAR(150)   NULL,
    telefono        NVARCHAR(60)    NULL,
    correo          NVARCHAR(150)   NULL,
    observaciones   NVARCHAR(2000)  NULL,
    demo            BIT             NOT NULL CONSTRAINT DF_clientes_demo DEFAULT (0),
    created         DATETIME2       NOT NULL CONSTRAINT DF_clientes_created DEFAULT (SYSUTCDATETIME()),
    updated         DATETIME2       NOT NULL CONSTRAINT DF_clientes_updated DEFAULT (SYSUTCDATETIME())
);
GO

-- ============================================================
-- lugares
-- ============================================================
IF OBJECT_ID(N'dbo.lugares', N'U') IS NULL
CREATE TABLE dbo.lugares (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    codigo          NVARCHAR(40)    NULL,
    cliente_id      INT             NULL,
    nombre          NVARCHAR(200)   NOT NULL,
    tipo            NVARCHAR(100)   NULL,
    direccion       NVARCHAR(300)   NULL,
    municipio       NVARCHAR(120)   NULL,
    departamento    NVARCHAR(120)   NULL,
    responsable     NVARCHAR(150)   NULL,
    cargo           NVARCHAR(150)   NULL,
    telefono        NVARCHAR(60)    NULL,
    correo          NVARCHAR(150)   NULL,
    observaciones   NVARCHAR(2000)  NULL,
    demo            BIT             NOT NULL CONSTRAINT DF_lugares_demo DEFAULT (0),
    created         DATETIME2       NOT NULL CONSTRAINT DF_lugares_created DEFAULT (SYSUTCDATETIME()),
    updated         DATETIME2       NOT NULL CONSTRAINT DF_lugares_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_lugares_cliente FOREIGN KEY (cliente_id) REFERENCES dbo.clientes(id) ON DELETE SET NULL
);
GO

-- ============================================================
-- tecnicos
-- ============================================================
IF OBJECT_ID(N'dbo.tecnicos', N'U') IS NULL
CREATE TABLE dbo.tecnicos (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    codigo          NVARCHAR(40)    NULL,
    nombre          NVARCHAR(200)   NOT NULL,
    cargo           NVARCHAR(120)   NULL,
    especialidad    NVARCHAR(120)   NULL,
    telefono        NVARCHAR(60)    NULL,
    correo          NVARCHAR(150)   NULL,
    activo          BIT             NOT NULL CONSTRAINT DF_tecnicos_activo DEFAULT (1),
    demo            BIT             NOT NULL CONSTRAINT DF_tecnicos_demo DEFAULT (0),
    created         DATETIME2       NOT NULL CONSTRAINT DF_tecnicos_created DEFAULT (SYSUTCDATETIME()),
    updated         DATETIME2       NOT NULL CONSTRAINT DF_tecnicos_updated DEFAULT (SYSUTCDATETIME())
);
GO

-- ============================================================
-- equipos
-- ============================================================
IF OBJECT_ID(N'dbo.equipos', N'U') IS NULL
CREATE TABLE dbo.equipos (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    lugar_id        INT             NULL,
    tipo            NVARCHAR(120)   NULL,
    marca           NVARCHAR(120)   NULL,
    modelo          NVARCHAR(120)   NULL,
    serie           NVARCHAR(120)   NULL,
    ip              NVARCHAR(60)    NULL,
    ubicacion       NVARCHAR(200)   NULL,
    estado          NVARCHAR(120)   NULL,
    observaciones   NVARCHAR(2000)  NULL,
    demo            BIT             NOT NULL CONSTRAINT DF_equipos_demo DEFAULT (0),
    created         DATETIME2       NOT NULL CONSTRAINT DF_equipos_created DEFAULT (SYSUTCDATETIME()),
    updated         DATETIME2       NOT NULL CONSTRAINT DF_equipos_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_equipos_lugar FOREIGN KEY (lugar_id) REFERENCES dbo.lugares(id) ON DELETE SET NULL
);
GO

-- ============================================================
-- catalogo  (materiales/insumos con precio)
-- ============================================================
IF OBJECT_ID(N'dbo.catalogo', N'U') IS NULL
CREATE TABLE dbo.catalogo (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    codigo          NVARCHAR(60)    NULL,
    categoria       NVARCHAR(100)   NULL,
    subcategoria    NVARCHAR(120)   NULL,
    descripcion     NVARCHAR(300)   NOT NULL,
    marca           NVARCHAR(120)   NULL,
    modelo          NVARCHAR(120)   NULL,
    unidad          NVARCHAR(40)    NULL,
    precio          DECIMAL(12,2)   NULL,
    iva             BIT             NOT NULL CONSTRAINT DF_catalogo_iva DEFAULT (0),
    activo          BIT             NOT NULL CONSTRAINT DF_catalogo_activo DEFAULT (1),
    demo            BIT             NOT NULL CONSTRAINT DF_catalogo_demo DEFAULT (0),
    created         DATETIME2       NOT NULL CONSTRAINT DF_catalogo_created DEFAULT (SYSUTCDATETIME()),
    updated         DATETIME2       NOT NULL CONSTRAINT DF_catalogo_updated DEFAULT (SYSUTCDATETIME())
);
GO

-- ============================================================
-- ordenes  (orden de trabajo / visita de mantenimiento)
-- ============================================================
IF OBJECT_ID(N'dbo.ordenes', N'U') IS NULL
CREATE TABLE dbo.ordenes (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    numero              NVARCHAR(40)    NOT NULL,
    fechaCreacion       NVARCHAR(30)    NULL,
    fechaProgramada     NVARCHAR(30)    NULL,
    horaProgramada      NVARCHAR(20)    NULL,
    horaLlegada         NVARCHAR(20)    NULL,
    horaFinalizacion    NVARCHAR(20)    NULL,
    cliente_id          INT             NULL,
    lugar_id            INT             NULL,
    tecnico_id          INT             NULL,
    tipoVisita          NVARCHAR(60)    NULL,
    prioridad           NVARCHAR(40)    NULL,
    estado              NVARCHAR(60)    NULL,

    -- columnas JSON (equivalentes a los campos "json" de PocketBase)
    motivo              NVARCHAR(MAX)   NULL,
    equipos             NVARCHAR(MAX)   NULL,
    checklist           NVARCHAR(MAX)   NULL,
    correctivo          NVARCHAR(MAX)   NULL,
    materiales          NVARCHAR(MAX)   NULL,
    requeridos          NVARCHAR(MAX)   NULL,
    fotos               NVARCHAR(MAX)   NULL,
    cierre              NVARCHAR(MAX)   NULL,
    firmas               NVARCHAR(MAX)   NULL,
    cotizacion          NVARCHAR(MAX)   NULL,
    corrMateriales      NVARCHAR(MAX)   NULL,

    creadoPor_id        INT             NULL,
    demo                BIT             NOT NULL CONSTRAINT DF_ordenes_demo DEFAULT (0),
    created             DATETIME2       NOT NULL CONSTRAINT DF_ordenes_created DEFAULT (SYSUTCDATETIME()),
    updated             DATETIME2       NOT NULL CONSTRAINT DF_ordenes_updated DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT UQ_ordenes_numero UNIQUE (numero),
    CONSTRAINT FK_ordenes_cliente FOREIGN KEY (cliente_id) REFERENCES dbo.clientes(id) ON DELETE SET NULL,
    CONSTRAINT FK_ordenes_lugar FOREIGN KEY (lugar_id) REFERENCES dbo.lugares(id) ON DELETE SET NULL,
    CONSTRAINT FK_ordenes_tecnico FOREIGN KEY (tecnico_id) REFERENCES dbo.tecnicos(id) ON DELETE SET NULL,
    CONSTRAINT FK_ordenes_creadoPor FOREIGN KEY (creadoPor_id) REFERENCES dbo.users(id) ON DELETE SET NULL,

    CONSTRAINT CK_ordenes_motivo CHECK (motivo IS NULL OR ISJSON(motivo) = 1),
    CONSTRAINT CK_ordenes_equipos CHECK (equipos IS NULL OR ISJSON(equipos) = 1),
    CONSTRAINT CK_ordenes_checklist CHECK (checklist IS NULL OR ISJSON(checklist) = 1),
    CONSTRAINT CK_ordenes_correctivo CHECK (correctivo IS NULL OR ISJSON(correctivo) = 1),
    CONSTRAINT CK_ordenes_materiales CHECK (materiales IS NULL OR ISJSON(materiales) = 1),
    CONSTRAINT CK_ordenes_requeridos CHECK (requeridos IS NULL OR ISJSON(requeridos) = 1),
    CONSTRAINT CK_ordenes_fotos CHECK (fotos IS NULL OR ISJSON(fotos) = 1),
    CONSTRAINT CK_ordenes_cierre CHECK (cierre IS NULL OR ISJSON(cierre) = 1),
    CONSTRAINT CK_ordenes_firmas CHECK (firmas IS NULL OR ISJSON(firmas) = 1),
    CONSTRAINT CK_ordenes_cotizacion CHECK (cotizacion IS NULL OR ISJSON(cotizacion) = 1),
    CONSTRAINT CK_ordenes_corrMateriales CHECK (corrMateriales IS NULL OR ISJSON(corrMateriales) = 1)
);
GO

-- Relación muchos-a-muchos: técnicos auxiliares asignados a una orden
-- (en PocketBase era un relation field "auxiliares" con maxSelect: 10)
IF OBJECT_ID(N'dbo.ordenes_auxiliares', N'U') IS NULL
CREATE TABLE dbo.ordenes_auxiliares (
    orden_id        INT NOT NULL,
    tecnico_id      INT NOT NULL,
    CONSTRAINT PK_ordenes_auxiliares PRIMARY KEY (orden_id, tecnico_id),
    CONSTRAINT FK_ordenes_auxiliares_orden FOREIGN KEY (orden_id) REFERENCES dbo.ordenes(id) ON DELETE CASCADE,
    CONSTRAINT FK_ordenes_auxiliares_tecnico FOREIGN KEY (tecnico_id) REFERENCES dbo.tecnicos(id) ON DELETE CASCADE
);
GO

-- ============================================================
-- cartas  (carta oferta / cotización)
-- ============================================================
IF OBJECT_ID(N'dbo.cartas', N'U') IS NULL
CREATE TABLE dbo.cartas (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    numero          NVARCHAR(60)    NOT NULL,
    version         INT             NULL,
    orden_id        INT             NULL,
    cliente_id      INT             NULL,
    lugar_id        INT             NULL,
    fecha           NVARCHAR(30)    NULL,
    diagnostico     NVARCHAR(4000)  NULL,
    justificacion   NVARCHAR(4000)  NULL,
    items           NVARCHAR(MAX)   NULL,
    descuento       DECIMAL(12,2)   NULL,
    ivaPorcentaje   DECIMAL(5,2)    NULL,
    estado          NVARCHAR(60)    NULL,
    condiciones     NVARCHAR(MAX)   NULL,
    aprobacion      NVARCHAR(MAX)   NULL,
    creadoPor_id    INT             NULL,
    demo            BIT             NOT NULL CONSTRAINT DF_cartas_demo DEFAULT (0),
    created         DATETIME2       NOT NULL CONSTRAINT DF_cartas_created DEFAULT (SYSUTCDATETIME()),
    updated         DATETIME2       NOT NULL CONSTRAINT DF_cartas_updated DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT UQ_cartas_numero UNIQUE (numero),
    CONSTRAINT FK_cartas_orden FOREIGN KEY (orden_id) REFERENCES dbo.ordenes(id) ON DELETE SET NULL,
    CONSTRAINT FK_cartas_cliente FOREIGN KEY (cliente_id) REFERENCES dbo.clientes(id) ON DELETE SET NULL,
    CONSTRAINT FK_cartas_lugar FOREIGN KEY (lugar_id) REFERENCES dbo.lugares(id) ON DELETE SET NULL,
    CONSTRAINT FK_cartas_creadoPor FOREIGN KEY (creadoPor_id) REFERENCES dbo.users(id) ON DELETE SET NULL,

    CONSTRAINT CK_cartas_items CHECK (items IS NULL OR ISJSON(items) = 1),
    CONSTRAINT CK_cartas_condiciones CHECK (condiciones IS NULL OR ISJSON(condiciones) = 1),
    CONSTRAINT CK_cartas_aprobacion CHECK (aprobacion IS NULL OR ISJSON(aprobacion) = 1)
);
GO

-- ============================================================
-- configuracion  (pares clave/valor de configuración global)
-- ============================================================
IF OBJECT_ID(N'dbo.configuracion', N'U') IS NULL
CREATE TABLE dbo.configuracion (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    clave           NVARCHAR(60)    NOT NULL,
    valor           NVARCHAR(MAX)   NULL,
    created         DATETIME2       NOT NULL CONSTRAINT DF_configuracion_created DEFAULT (SYSUTCDATETIME()),
    updated         DATETIME2       NOT NULL CONSTRAINT DF_configuracion_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT UQ_configuracion_clave UNIQUE (clave),
    CONSTRAINT CK_configuracion_valor CHECK (valor IS NULL OR ISJSON(valor) = 1)
);
GO

-- ============================================================
-- Índices de apoyo para las búsquedas más comunes en la app
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ordenes_estado' AND object_id = OBJECT_ID('dbo.ordenes'))
    CREATE INDEX IX_ordenes_estado ON dbo.ordenes(estado);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ordenes_cliente' AND object_id = OBJECT_ID('dbo.ordenes'))
    CREATE INDEX IX_ordenes_cliente ON dbo.ordenes(cliente_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ordenes_lugar' AND object_id = OBJECT_ID('dbo.ordenes'))
    CREATE INDEX IX_ordenes_lugar ON dbo.ordenes(lugar_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_cartas_estado' AND object_id = OBJECT_ID('dbo.cartas'))
    CREATE INDEX IX_cartas_estado ON dbo.cartas(estado);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_lugares_cliente' AND object_id = OBJECT_ID('dbo.lugares'))
    CREATE INDEX IX_lugares_cliente ON dbo.lugares(cliente_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_equipos_lugar' AND object_id = OBJECT_ID('dbo.equipos'))
    CREATE INDEX IX_equipos_lugar ON dbo.equipos(lugar_id);
GO
