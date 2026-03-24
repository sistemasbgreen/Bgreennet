/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 18/03/2026
Description  : Activa automáticamente los pulsos cuya fecha de activación ya llegó
History      : - /
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    18/03/2026      Creación SP activación automática por fecha

***************************/

CREATE OR ALTER PROCEDURE [dbo].[sp_Pulsos_ActivarPorFecha]
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Pulsos
    SET activo      = 1,
        date_Modify = GETDATE()
    WHERE fecha_Activacion IS NOT NULL
      AND fecha_Activacion <= GETDATE()
      AND activo = 0;
END
GO
