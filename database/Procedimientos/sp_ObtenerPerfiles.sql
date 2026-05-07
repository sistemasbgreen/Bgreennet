/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 4/12/2025
Description  : procedimeinto 
History      : -Perfil / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    4/12/2025      Creacion de procedimiento sp_ObtenerPerfiles

***************************/

CREATE PROCEDURE [dbo].[sp_ObtenerPerfiles]
    @id_perfil INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @id_perfil IS NULL
    BEGIN
        SELECT id_perfil, descripcionPerfil, date_create, date_Modify, activo
        FROM [dbo].[Perfil]
        ORDER BY id_perfil;
    END
    ELSE
    BEGIN
        SELECT id_perfil, descripcionPerfil, date_create, date_Modify, activo
        FROM [dbo].[Perfil]
        WHERE id_perfil = @id_perfil;
    END
END;