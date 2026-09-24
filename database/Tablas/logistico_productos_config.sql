-- =========================================================================
-- Tabla: logistico_productos_config
-- Descripción: Almacena la configuración de visibilidad de productos para
--              el Módulo Logístico (TBS). Permite definir si un producto es
--              mostrado en la vista principal o clasificado como "Oculto".
-- =========================================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logistico_productos_config]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[logistico_productos_config] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [nombre_producto] VARCHAR(255) NOT NULL,
        [permitido] BIT NOT NULL DEFAULT 1,                     -- 1: Permitido (vista principal), 0: Oculto
        [fecha_creacion] DATETIME NOT NULL DEFAULT GETDATE(),
        [fecha_modificacion] DATETIME NOT NULL DEFAULT GETDATE(),
        [usuario] VARCHAR(100) NULL,
        CONSTRAINT UQ_logistico_productos_nombre UNIQUE ([nombre_producto])
    );

    CREATE INDEX IX_logistico_productos_permitido ON [dbo].[logistico_productos_config] ([permitido]);
END
GO

-- =========================================================================
-- Datos semilla iniciales (productos permitidos por defecto)
-- =========================================================================
DECLARE @SeedProducts TABLE (nombre VARCHAR(255));

INSERT INTO @SeedProducts (nombre) VALUES
    ('(MP) ACEITE CRUDO DE PALMA'),
    ('BIODIESEL DESTILADO'),
    ('RESIDUO LIQUIDO (DESECHO SIN VALOR COMERCIAL)'),
    ('(MP) METANOL'),
    ('(INS) METILATO DE SODIO'),
    ('(INS) ESTEARINA DE PALMA'),
    ('(INS) NITROGENO LIQUIDO'),
    ('GLICERINA CRUDA'),
    ('FONDOS DE DESTILACION'),
    ('(INS) ACIDO CLORHIDRICO'),
    ('DESECHOS SIN VALOR -TIERRAS USADAS'),
    ('DESECHOS SIN VALOR - TIERRAS USADAS'),
    ('(INS) ACIDO FOSFORICO'),
    ('(INS) SODA CAUSTICA LIQUIDA'),
    ('DESECHOS DE RESINAS USADAS'),
    ('(INS) RESINA DE GUARD LEWATIT MONO PLUS SP112 H'),
    ('(INS) RESINA DE GUARD LEWATIT  MONO PLUS SP112 H');

INSERT INTO [dbo].[logistico_productos_config] ([nombre_producto], [permitido], [usuario])
SELECT s.nombre, 1, 'SISTEMA_INICIAL'
FROM @SeedProducts s
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[logistico_productos_config] c 
    WHERE UPPER(LTRIM(RTRIM(c.[nombre_producto]))) = UPPER(LTRIM(RTRIM(s.nombre)))
);
GO
