/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 24/10/2025
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    24/10/2025      Creacion de tablas Area

***************************/
use BgreenNet_Dev;

CREATE TABLE Area (
    id_area INT IDENTITY(1,1) PRIMARY KEY,
    descripcionArea NVARCHAR(100) NOT NULL,
    id_direccion_fk INT NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
	date_create DATETIME NOT NULL DEFAULT GETDATE(),
	date_Modify DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (id_direccion_fk) REFERENCES Direccion(id_direccion)

);
