/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 24/10/2025
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    24/10/2025      Creacion de tablas SistemaInformacion

***************************/
use BgreenNet_Dev;

CREATE TABLE SistemaInformacion (
    id_sistema INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    url NVARCHAR(255) NULL,
    imagen_url NVARCHAR(255) NULL,
    activo BIT NOT NULL DEFAULT 1,
	date_create DATETIME NOT NULL DEFAULT GETDATE(),
	date_Modify DATETIME NOT NULL DEFAULT GETDATE(),
    fecha_creacion DATETIME DEFAULT GETDATE()
);