/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 2/11/2025
Description  : procedimeinto 
History      : -Sistema Informacion / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    2/10/2025      Creacion Procedimiento sp_CrearSistema

***************************/

CREATE PROCEDURE [dbo].[sp_CrearSistema]
    @nombre NVARCHAR(255),
    @url NVARCHAR(500),
    @imagen_url NVARCHAR(500) = NULL,
    @FK_tipo_sistema INT,
    @activo BIT = 1 -- Por defecto activo
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @fechaActual DATETIME = GETDATE();

    INSERT INTO [dbo].[SistemaInformacion] (
        [nombre],
        [url],
        [imagen_url],
        [activo],
        [date_create],
        [date_modify],
        [FK_tipo_sistema]
    )
    VALUES (
        @nombre,
        @url,
        @imagen_url,
        @activo,
        @fechaActual,
        @fechaActual,
        @FK_tipo_sistema
    );

    SELECT SCOPE_IDENTITY() AS id_sistema_creado;
END;