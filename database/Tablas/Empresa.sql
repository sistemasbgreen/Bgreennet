/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 24/10/2025
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    24/10/2025      Creacion de tablas Empresa

***************************/
use BgreenNet_Dev;

CREATE TABLE Empresa (
    id_empresa INT IDENTITY(1,1) PRIMARY KEY,
    descripcionEmpresa NVARCHAR(150) NOT NULL,
	date_create DATETIME NOT NULL DEFAULT GETDATE(),
	date_Modify DATETIME NOT NULL DEFAULT GETDATE(),
    activo BIT NOT NULL DEFAULT 1
);
