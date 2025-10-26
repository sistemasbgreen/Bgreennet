/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 24/10/2025
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    24/10/2025      Creacion de tablas Logs

***************************/
use BgreenNet_Dev;

CREATE TABLE Logs (
    Id_Logs INT IDENTITY(1,1) NOT NULL,
    fecha DATETIME2 NOT NULL DEFAULT GETDATE(),
    usuario NVARCHAR(50) NULL,
    accion NVARCHAR(100) NOT NULL,
    tabla NVARCHAR(50) NULL,
    mensaje NVARCHAR(500) NOT NULL,
    CONSTRAINT PK_Logs PRIMARY KEY CLUSTERED (Id_Logs)
);