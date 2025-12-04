/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 2/11/2025
Description  : procedimeinto 
History      : -Sistema Informacion / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    2/11/2025      Creacion Procedimiento sp_ConsultarSistema

***************************/

CREATE PROCEDURE [dbo].[sp_ConsultarSistema]
    @id_sistema INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        [id_sistema],
        [nombre],
        [url],
        [imagen_url],
        [activo],
        [date_create],
        [date_modify],
        [FK_tipo_sistema]
    FROM [dbo].[SistemaInformacion]

END;