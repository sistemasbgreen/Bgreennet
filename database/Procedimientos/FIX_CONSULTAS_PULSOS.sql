/***************************
Procedimientos Almacenados Estandarizados para Pulsos
Ejecutar este script en SQL Server para corregir el error de conversión.
***************************/

-- 1. CONSULTAR TODOS
CREATE OR ALTER PROCEDURE [dbo].[sp_Pulsos_ConsultarTodos]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        [id_pulso],               -- 0
        [titulo],                 -- 1
        [descripcion],            -- 2
        [imagen_url],             -- 3
        [imagen_nombre_original], -- 4
        [imagen_tipo_mime],       -- 5
        [imagen_tamano_bytes],    -- 6
        [Fecha_Final],            -- 7
        [date_create],            -- 8
        [date_Modify],            -- 9
        [activo],                 -- 10
        [creado_por],             -- 11
        [fecha_Activacion]        -- 12
    FROM [dbo].[Pulsos]
    ORDER BY [date_create] DESC
END
GO

-- 2. CONSULTAR ACTIVOS
CREATE OR ALTER PROCEDURE [dbo].[sp_Pulsos_ConsultarActivos]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        [id_pulso],               -- 0
        [titulo],                 -- 1
        [descripcion],            -- 2
        [imagen_url],             -- 3
        [imagen_nombre_original], -- 4
        [imagen_tipo_mime],       -- 5
        [imagen_tamano_bytes],    -- 6
        [Fecha_Final],            -- 7
        [date_create],            -- 8
        [date_Modify],            -- 9
        [activo],                 -- 10
        [creado_por],             -- 11
        [fecha_Activacion]        -- 12
    FROM [dbo].[Pulsos]
    WHERE [activo] = 1 
      AND [Fecha_Final] >= GETDATE()
      AND ([fecha_Activacion] IS NULL OR [fecha_Activacion] <= GETDATE())
    ORDER BY [date_create] DESC
END
GO

-- 3. CONSULTAR POR ID
CREATE OR ALTER PROCEDURE [dbo].[sp_Pulsos_ConsultarPorId]
    @id_pulso INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        [id_pulso],               -- 0
        [titulo],                 -- 1
        [descripcion],            -- 2
        [imagen_url],             -- 3
        [imagen_nombre_original], -- 4
        [imagen_tipo_mime],       -- 5
        [imagen_tamano_bytes],    -- 6
        [Fecha_Final],            -- 7
        [date_create],            -- 8
        [date_Modify],            -- 9
        [activo],                 -- 10
        [creado_por],             -- 11
        [fecha_Activacion]        -- 12
    FROM [dbo].[Pulsos]
    WHERE [id_pulso] = @id_pulso
END
GO
