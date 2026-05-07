/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 18/03/2026
Description  : Actualiza un pulso existente
History      : - /
***************************/

CREATE OR ALTER PROCEDURE [dbo].[sp_Pulsos_Actualizar]
    @id_pulso INT,
    @titulo NVARCHAR(255),
    @descripcion NVARCHAR(MAX) = NULL,
    @imagen_url NVARCHAR(500) = NULL,
    @imagen_nombre_original NVARCHAR(255) = NULL,
    @imagen_tipo_mime NVARCHAR(100) = NULL,
    @imagen_tamano_bytes INT = NULL,
    @Fecha_Final DATETIME,
    @activo BIT,
    @fecha_Activacion DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE [dbo].[Pulsos]
    SET [titulo]                 = @titulo,
        [descripcion]            = @descripcion,
        [imagen_url]             = @imagen_url,
        [imagen_nombre_original] = @imagen_nombre_original,
        [imagen_tipo_mime]       = @imagen_tipo_mime,
        [imagen_tamano_bytes]    = @imagen_tamano_bytes,
        [Fecha_Final]            = @Fecha_Final,
        [activo]                 = @activo,
        [fecha_Activacion]       = @fecha_Activacion,
        [date_Modify]            = GETDATE()
    WHERE [id_pulso] = @id_pulso;
END
GO
