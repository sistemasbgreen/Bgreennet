/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 4/12/2025
Description  : procedimeinto 
History      : -Perfil / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    4/12/2025      Creacion de procedimiento sp_Crear_Perfil
***************************/

CREATE PROCEDURE sp_Crear_Perfil
    @descripcionPerfil NVARCHAR(255),
    @activo BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [dbo].[Perfil] (descripcionPerfil, date_create, date_Modify, activo)
    VALUES (@descripcionPerfil, GETDATE(), GETDATE(), @activo);
END;