/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 24/10/2025
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    24/10/2025      Creacion de tablas Cargo

***************************/
use BgreenNet_Dev;

CREATE TABLE Cargo (
    id_cargo INT IDENTITY(1,1) PRIMARY KEY,
    descripcionCargo NVARCHAR(100) NOT NULL,
	date_create DATETIME NOT NULL DEFAULT GETDATE(),
	date_Modify DATETIME NOT NULL DEFAULT GETDATE(),
    activo BIT NOT NULL DEFAULT 1
);

