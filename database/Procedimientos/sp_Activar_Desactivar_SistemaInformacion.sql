/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 2/11/2025
Description  : procedimeinto 
History      : -Sistema Informacion / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    2/10/2025      Creacion Procedimiento sp_Activar_Desactivar_SistemaInformacion

***************************/


CREATE PROCEDURE [dbo].[sp_Activar_Desactivar_SistemaInformacion]
    @id_sistema INT,
    @activo BIT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE [dbo].[SistemaInformacion]
    SET 
        [activo] = @activo,
        [date_modify] = GETDATE()
    WHERE [id_sistema] = @id_sistema;

    IF @@ROWCOUNT = 0
        RAISERROR('No se encontró el sistema con ID %d', 16, 1, @id_sistema);
END;