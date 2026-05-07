/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 10/12/2025
Description  : procedimeinto 
History      : -Sistema Informacion / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    10/12/2025      Creacion Procedimiento sp_AsignarPermisoAPerfil

***************************/


ALTER PROCEDURE [dbo].[sp_AsignarPermisoAPerfil]
    @id_perfil_fk INT,
    @id_sistema_fk INT
AS
BEGIN
    SET NOCOUNT ON;

    IF @id_perfil_fk IS NULL OR @id_sistema_fk IS NULL
    BEGIN
        RAISERROR('Los parámetros id_perfil_fk e id_sistema_fk son obligatorios.', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1 
        FROM PermisoSistema 
        WHERE id_perfil_fk = @id_perfil_fk 
          AND id_sistema_fk = @id_sistema_fk
    )
    BEGIN
        UPDATE PermisoSistema
        SET activo = 1
        WHERE id_perfil_fk = @id_perfil_fk 
          AND id_sistema_fk = @id_sistema_fk;

        RETURN;
    END

    INSERT INTO PermisoSistema (id_perfil_fk, id_sistema_fk, activo)
    VALUES (@id_perfil_fk, @id_sistema_fk, 1);

END