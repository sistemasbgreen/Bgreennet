/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 4/12/2025
Description  : procedimeinto 
History      : -Perfil / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    4/12/2025      Creacion de procedimiento sp_ActualizarPerfil

***************************/

CREATE PROCEDURE [dbo].[sp_ActualizarPerfil]
    @id_perfil INT,
    @descripcionPerfil NVARCHAR(255),
    @activo BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM [dbo].[Perfil] WHERE id_perfil = @id_perfil)
    BEGIN
        UPDATE [dbo].[Perfil]
        SET descripcionPerfil = @descripcionPerfil,
            date_Modify = GETDATE(),
            activo = @activo
        WHERE id_perfil = @id_perfil;
    END
    ELSE
    BEGIN
        RAISERROR('El perfil con el ID especificado no existe.', 16, 1);
    END
END;