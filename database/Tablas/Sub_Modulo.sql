/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 24/10/2025
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    24/10/2025      Creacion de tablas Sub_Modulo

***************************/
use BgreenNet_Dev;

CREATE TABLE Sub_Modulo (
    id_sub_modulo INT IDENTITY(1,1) PRIMARY KEY,
    submodulo NVARCHAR(100) NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    iconos NVARCHAR(100) NULL,
    id_modulo_fk INT NOT NULL,
	date_create DATETIME NOT NULL DEFAULT GETDATE(),
	date_Modify DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (id_modulo_fk) REFERENCES Modulo(id_modulo)
);