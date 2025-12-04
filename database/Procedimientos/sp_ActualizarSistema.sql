/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 2/11/2025
Description  : procedimeinto 
History      : -Sistema Informacion / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    2/10/2025      Creacion Procedimiento sp_ActualizarSistema

***************************/

CREATE PROCEDURE [dbo].[sp_ActualizarSistema]
    @id_sistema INT,
    @nombre NVARCHAR(255),
    @url NVARCHAR(500),
    @imagen_url NVARCHAR(500) = NULL,
    @FK_tipo_sistema INT,
    @activo BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE [dbo].[SistemaInformacion]
    SET 
        [nombre] = @nombre,
        [url] = @url,
        [imagen_url] = @imagen_url,
        [activo] = @activo,
        [date_modify] = GETDATE(),
        [FK_tipo_sistema] = @FK_tipo_sistema
    WHERE [id_sistema] = @id_sistema;

    -- Verificar si se actualizó algo
    IF @@ROWCOUNT = 0
        RAISERROR('No se encontró el sistema con ID %d', 16, 1, @id_sistema);
END;
