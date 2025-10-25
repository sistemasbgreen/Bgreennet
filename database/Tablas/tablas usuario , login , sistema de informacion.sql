-- =============================================
-- CREACIÓN DE TABLAS Usuario , Login , sistemas de informacion , permisos
-- =============================================

use [BgreenNet_Dev]

CREATE TABLE Direccion (
    id_direccion INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    activo BIT NOT NULL DEFAULT 1
);

CREATE TABLE Area (
    id_area INT IDENTITY(1,1) PRIMARY KEY,
    descripcionArea NVARCHAR(100) NOT NULL,
    id_direccion_fk INT NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_direccion_fk) REFERENCES Direccion(id_direccion)
);

CREATE TABLE Cargo (
    id_cargo INT IDENTITY(1,1) PRIMARY KEY,
    descripcionCargo NVARCHAR(100) NOT NULL,
    activo BIT NOT NULL DEFAULT 1
);

CREATE TABLE Empresa (
    id_empresa INT IDENTITY(1,1) PRIMARY KEY,
    descripcionEmpresa NVARCHAR(150) NOT NULL,
    activo BIT NOT NULL DEFAULT 1
);

CREATE TABLE TipoIdentificacion (
    id_tipoidentificacion INT IDENTITY(1,1) PRIMARY KEY,
    descripcion NVARCHAR(50) NOT NULL,
    activo BIT NOT NULL DEFAULT 1
);

CREATE TABLE Perfil (
    id_perfil INT IDENTITY(1,1) PRIMARY KEY,
    descripcionPerfil NVARCHAR(100) NOT NULL,
    activo BIT NOT NULL DEFAULT 1
);

CREATE TABLE Usuario (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    usuario NVARCHAR(50) NOT NULL,
    contrasena NVARCHAR(255) NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    ultima_conexion DATETIME NULL,
    id_perfil_fk INT NOT NULL,
    id_empresa_fk INT NOT NULL,
    id_area_fk INT NOT NULL,
    id_cargo_fk INT NOT NULL,
    FOREIGN KEY (id_perfil_fk) REFERENCES Perfil(id_perfil),
    FOREIGN KEY (id_empresa_fk) REFERENCES Empresa(id_empresa),
    FOREIGN KEY (id_area_fk) REFERENCES Area(id_area),
    FOREIGN KEY (id_cargo_fk) REFERENCES Cargo(id_cargo)
);

CREATE TABLE DetalleUsuario (
    id_detalle_usuario INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario_fk INT NOT NULL,
    id_tipoidentificacion_fk INT NOT NULL,
    identificacion NVARCHAR(50) NOT NULL,
    nombre NVARCHAR(100) NOT NULL,
    apellido NVARCHAR(100) NOT NULL,
    razon_social NVARCHAR(150) NULL,
    correo NVARCHAR(100) NOT NULL,
    celular NVARCHAR(20) NULL,
    activo BIT NOT NULL DEFAULT 1,
    fecha_nacimiento DATE NULL,
    FOREIGN KEY (id_usuario_fk) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_tipoidentificacion_fk) REFERENCES TipoIdentificacion(id_tipoidentificacion)
);

CREATE TABLE Modulo (
    id_modulo INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(255) NULL,
    activo BIT NOT NULL DEFAULT 1
);

CREATE TABLE Sub_Modulo (
    id_sub_modulo INT IDENTITY(1,1) PRIMARY KEY,
    submodulo NVARCHAR(100) NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    iconos NVARCHAR(100) NULL,
    id_modulo_fk INT NOT NULL,
    FOREIGN KEY (id_modulo_fk) REFERENCES Modulo(id_modulo)
);

CREATE TABLE Permiso (
    id_permiso INT IDENTITY(1,1) PRIMARY KEY,
    id_perfil_fk INT NOT NULL,
    id_sub_modulo_fk INT NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    descripcion NVARCHAR(255) NULL,
    FOREIGN KEY (id_perfil_fk) REFERENCES Perfil(id_perfil),
    FOREIGN KEY (id_sub_modulo_fk) REFERENCES Sub_Modulo(id_sub_modulo)
);

CREATE TABLE Acciones (
    id_accion INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(255) NULL,
    id_permiso_fk INT NOT NULL,
    FOREIGN KEY (id_permiso_fk) REFERENCES Permiso(id_permiso)
);

CREATE TABLE SistemaInformacion (
    id_sistema INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    url NVARCHAR(255) NULL,
    imagen_url NVARCHAR(255) NULL,
    activo BIT NOT NULL DEFAULT 1,
    fecha_creacion DATETIME DEFAULT GETDATE()
);

CREATE TABLE PermisoSistema (
    id_permiso_sistema INT IDENTITY(1,1) PRIMARY KEY,
    id_perfil_fk INT NOT NULL,
    id_sistema_fk INT NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_perfil_fk) REFERENCES Perfil(id_perfil),
    FOREIGN KEY (id_sistema_fk) REFERENCES SistemaInformacion(id_sistema)
);

CREATE TABLE Estados (
    id_Estados INT IDENTITY(1,1) PRIMARY KEY,
    descripcion NVARCHAR(50) NOT NULL,
    activo BIT NOT NULL DEFAULT 1
);

CREATE TABLE Logs (
    Id_Logs INT IDENTITY(1,1) NOT NULL,
    fecha DATETIME2 NOT NULL DEFAULT GETDATE(),
    usuario NVARCHAR(50) NULL,
    accion NVARCHAR(100) NOT NULL,
    tabla NVARCHAR(50) NULL,
    mensaje NVARCHAR(500) NOT NULL,
    CONSTRAINT PK_Logs PRIMARY KEY CLUSTERED (Id_auditoria)
);