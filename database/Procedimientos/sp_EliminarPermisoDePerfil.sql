/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 10/12/2025
Description  : procedimeinto 
History      : -Perfil / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    10/12/2025      Creacion de procedimiento sp_EliminarPermisoDePerfil
***************************/

ALTER PROCEDURE [dbo].[sp_EliminarPermisoDePerfil]
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

    DELETE FROM PermisoSistema
    WHERE id_perfil_fk = @id_perfil_fk 
      AND id_sistema_fk = @id_sistema_fk;

END