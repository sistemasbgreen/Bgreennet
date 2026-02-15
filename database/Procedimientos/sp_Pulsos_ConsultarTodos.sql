-- =============================================
-- SP para CONSULTAR TODOS los pulsos (administración)
-- =============================================
CREATE PROCEDURE [dbo].[sp_Pulsos_ConsultarTodos]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        [id_pulso],
        [titulo],
        [descripcion],
        [imagen_url],
        [imagen_nombre_original],
        [imagen_tipo_mime],
        [imagen_tamano_bytes],
        [Fecha_Final],
        FORMAT([Fecha_Final], 'dd/MM/yyyy HH:mm') AS fecha_expiracion_formateada,
        [date_create],
        FORMAT([date_create], 'dd/MM/yyyy HH:mm') AS fecha_creacion_formateada,
        [date_Modify],
        FORMAT([date_Modify], 'dd/MM/yyyy HH:mm') AS fecha_modificacion_formateada,
        [activo],
        CASE 
            WHEN [activo] = 1 AND [Fecha_Final] >= GETDATE() THEN 'Vigente'
            WHEN [activo] = 1 AND [Fecha_Final] < GETDATE() THEN 'Expirado'
            ELSE 'Inactivo'
        END AS estado_descripcion,
        [creado_por]
    FROM [dbo].[Pulsos]
    ORDER BY [date_create] DESC
END
GO