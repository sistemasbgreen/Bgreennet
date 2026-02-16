-- =============================================
-- SP para CONSULTAR TODOS los pulsos (administraci�n)
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
        FORMAT([Fecha_Final], 'dd/MM/yyyy HH:mm') AS Fecha_Final,
        FORMAT([date_create], 'dd/MM/yyyy HH:mm') AS date_create,
        FORMAT([date_Modify], 'dd/MM/yyyy HH:mm') AS date_Modify,
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