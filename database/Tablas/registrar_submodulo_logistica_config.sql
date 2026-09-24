-- =========================================================================
-- Script: Registro del Submódulo "Logistica Config" en BgreenNet
-- Módulo Padre: Configuración
-- Descripción : Registra el submódulo "Logistica Config" para que aparezca
--               en el menú lateral de Configuración y se pueda acceder
--               de forma independiente.
-- =========================================================================

USE [BgreenNet_Dev];
GO

DECLARE @id_modulo_config INT;

-- 1. Obtener ID del módulo Configuración
SELECT TOP 1 @id_modulo_config = id_modulo
FROM [dbo].[Modulo]
WHERE LOWER(nombre) LIKE '%configura%' OR LOWER(ruta) LIKE '%configura%';

IF @id_modulo_config IS NOT NULL
BEGIN
    PRINT 'ID del módulo Configuración encontrado: ' + CAST(@id_modulo_config AS VARCHAR(10));

    -- 2. Insertar Sub_Modulo si no existe
    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Sub_Modulo] 
        WHERE id_modulo_fk = @id_modulo_config 
          AND (LOWER(submodulo) LIKE '%logistica%' OR LOWER(ruta) LIKE '%logistica%')
    )
    BEGIN
        INSERT INTO [dbo].[Sub_Modulo] ([submodulo], [activo], [iconos], [id_modulo_fk], [ruta])
        VALUES ('Logistica Config', 1, 'bi bi-truck', @id_modulo_config, 'logistica-config');

        PRINT 'Submódulo "Logistica Config" insertado correctamente.';
    END
    ELSE
    BEGIN
        PRINT 'El submódulo "Logistica Config" ya existe en la base de datos.';
    END

    -- 3. Asignar permiso a los perfiles existentes (ej. Administrador / perfil 1)
    DECLARE @id_submodulo INT;
    SELECT TOP 1 @id_submodulo = id_sub_modulo
    FROM [dbo].[Sub_Modulo]
    WHERE id_modulo_fk = @id_modulo_config 
      AND (LOWER(submodulo) LIKE '%logistica%' OR LOWER(ruta) LIKE '%logistica%');

    IF @id_submodulo IS NOT NULL AND OBJECT_ID(N'[dbo].[PermisoSubModulo]', N'U') IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM [dbo].[PermisoSubModulo] WHERE id_submodulo_fk = @id_submodulo AND id_perfil_fk = 1)
        BEGIN
            INSERT INTO [dbo].[PermisoSubModulo] ([id_perfil_fk], [id_submodulo_fk], [activo])
            VALUES (1, @id_submodulo, 1);
            PRINT 'Permiso asignado al Perfil 1.';
        END
    END
END
ELSE
BEGIN
    PRINT 'No se encontró el módulo Configuración en la tabla Modulo.';
END
GO
