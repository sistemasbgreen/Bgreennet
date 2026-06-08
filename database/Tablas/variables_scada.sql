USE BgreenNet_Dev;
GO

-- 1. Tabla de Unidades de Proceso (Planta)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[unidades_planta]') AND type in (N'U'))
BEGIN
    CREATE TABLE unidades_planta (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        estado INT DEFAULT 1, -- 1 activo, 0 inactivo
        date_create DATETIME DEFAULT GETDATE(),
        date_modify DATETIME DEFAULT GETDATE(),
        usuario VARCHAR(100) NULL
    );
END
GO

-- 2. Tabla de Unidades de Medida Físicas
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[unidades_medida]') AND type in (N'U'))
BEGIN
    CREATE TABLE unidades_medida (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE,
        estado INT DEFAULT 1, -- 1 activo, 0 inactivo
        date_create DATETIME DEFAULT GETDATE(),
        date_modify DATETIME DEFAULT GETDATE(),
        usuario VARCHAR(100) NULL
    );
END
GO

-- 3. Tabla de Variables y Configuración
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[variables_scada]') AND type in (N'U'))
BEGIN
    CREATE TABLE variables_scada (
        tag VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        unidad_id INT NOT NULL,
        unit_id INT NULL,
        meta_min FLOAT NULL,
        meta_max FLOAT NULL,
        notificar BIT DEFAULT 0, -- 1 para sonar y enviar correo, 0 normal
        creado_en DATETIME DEFAULT GETDATE(),
        actualizado_en DATETIME DEFAULT GETDATE(),
        usuario VARCHAR(100) NULL,
        FOREIGN KEY (unidad_id) REFERENCES unidades_planta(id),
        FOREIGN KEY (unit_id) REFERENCES unidades_medida(id)
    );
END
ELSE
BEGIN
    -- Si la tabla ya existe, agregar la columna notificar si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[variables_scada]') AND name = 'notificar')
    BEGIN
        ALTER TABLE variables_scada ADD notificar BIT DEFAULT 0;
    END
END
GO
