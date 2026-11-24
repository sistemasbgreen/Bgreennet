-- =========================================================================
-- Script: Registro del Módulo "Items" y Submódulo en BgreenNet
-- Descripción : Registra el módulo "Items" y el submódulo de existencias
--               para que aparezca en el menú lateral y en el sistema.
-- =========================================================================

USE [BgreenNet_Dev];
GO

-- 1. Insertar Módulo "Items" si no existe
DECLARE @id_modulo_items INT;

SELECT TOP 1 @id_modulo_items = id_modulo
FROM [dbo].[Modulo]
WHERE LOWER(nombre) = 'items' OR LOWER(ruta) = 'items';

IF @id_modulo_items IS NULL
BEGIN
    INSERT INTO [dbo].[Modulo] ([nombre], [date_create], [date_Modify], [iconos], [activo], [ruta])
    VALUES ('Items', GETDATE(), GETDATE(), 'bi bi-boxes', 1, 'items');

    SET @id_modulo_items = SCOPE_IDENTITY();
    PRINT 'Módulo "Items" creado exitosamente con ID: ' + CAST(@id_modulo_items AS VARCHAR(10));
END
ELSE
BEGIN
    PRINT 'El módulo "Items" ya existe con ID: ' + CAST(@id_modulo_items AS VARCHAR(10));
END

-- 2. Insertar Submódulo "Consulta de Existencias" si no existe
DECLARE @id_submodulo_items INT;

SELECT TOP 1 @id_submodulo_items = id_sub_modulo
FROM [dbo].[Sub_Modulo]
WHERE id_modulo_fk = @id_modulo_items 
  AND (LOWER(submodulo) LIKE '%existencia%' OR LOWER(ruta) = 'existencias');

IF @id_submodulo_items IS NULL
BEGIN
    INSERT INTO [dbo].[Sub_Modulo] ([submodulo], [activo], [iconos], [id_modulo_fk], [date_create], [date_Modify], [ruta])
    VALUES ('Consulta de Existencias', 1, 'bi bi-clipboard2-data', @id_modulo_items, GETDATE(), GETDATE(), 'existencias');

    SET @id_submodulo_items = SCOPE_IDENTITY();
    PRINT 'Submódulo "Consulta de Existencias" creado con ID: ' + CAST(@id_submodulo_items AS VARCHAR(10));
END
ELSE
BEGIN
    PRINT 'El submódulo ya existe con ID: ' + CAST(@id_submodulo_items AS VARCHAR(10));
END

-- 3. Asignar permiso a los perfiles activos (ej. Perfil 1 / Administrador)
IF @id_submodulo_items IS NOT NULL AND OBJECT_ID(N'[dbo].[PermisoSubModulo]', N'U') IS NOT NULL
BEGIN
    -- Asignar al Perfil 1 (Administrador)
    IF NOT EXISTS (SELECT 1 FROM [dbo].[PermisoSubModulo] WHERE id_submodulo_fk = @id_submodulo_items AND id_perfil_fk = 1)
    BEGIN
        INSERT INTO [dbo].[PermisoSubModulo] ([id_perfil_fk], [id_submodulo_fk], [activo])
        VALUES (1, @id_submodulo_items, 1);
        PRINT 'Permiso asignado al Perfil 1 (Administrador).';
    END
    ELSE
    BEGIN
        UPDATE [dbo].[PermisoSubModulo]
        SET [activo] = 1
        WHERE id_submodulo_fk = @id_submodulo_items AND id_perfil_fk = 1;
        PRINT 'Permiso actualizado como activo para el Perfil 1.';
    END
END

-- 4. Opcional: Registrar en SistemaInformacion para acceso directo desde el Home
IF OBJECT_ID(N'[dbo].[SistemaInformacion]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [dbo].[SistemaInformacion] WHERE LOWER(nombre) LIKE '%item%' OR url LIKE '%items%')
    BEGIN
        DECLARE @tipo_sistema INT = 1;
        IF EXISTS (SELECT 1 FROM [dbo].[tipo_sistema] WHERE id_tipo_sistema = 1)
            SET @tipo_sistema = 1;
        ELSE
            SELECT TOP 1 @tipo_sistema = id_tipo_sistema FROM [dbo].[tipo_sistema];

        INSERT INTO [dbo].[SistemaInformacion] ([nombre], [url], [imagen_url], [activo], [FK_tipo_sistema])
        VALUES (
            'Ítems y Existencias',
            '/app/items/existencias',
            'https://cdn-icons-png.flaticon.com/512/2875/2875333.png',
            1,
            @tipo_sistema
        );
        PRINT 'SistemaInformacion "Ítems y Existencias" agregado para la pantalla Home.';
    END
END

PRINT 'Configuración de base de datos para el Módulo Items finalizada con éxito.';
GO
