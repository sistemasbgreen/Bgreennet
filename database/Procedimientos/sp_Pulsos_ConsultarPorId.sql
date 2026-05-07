/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 18/03/2026
Description  : Consulta un pulso por su ID
History      : - /
***************************/

CREATE OR ALTER PROCEDURE [dbo].[sp_Pulsos_ConsultarPorId]
    @id_pulso INT
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
        [creado_por],
        [fecha_Activacion],
        CASE 
            WHEN [activo] = 1 AND [Fecha_Final] >= GETDATE() THEN 'Vigente'
            WHEN [activo] = 1 AND [Fecha_Final] < GETDATE() THEN 'Expirado'
            ELSE 'Inactivo'
        END AS estado_descripcion
    FROM [dbo].[Pulsos]
    WHERE [id_pulso] = @id_pulso
END
GO
