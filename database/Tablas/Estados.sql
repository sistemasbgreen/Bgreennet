/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 24/10/2025
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    24/10/2025      Creacion de tablas Estados

***************************/
use BgreenNet_Dev;

CREATE TABLE Estados (
    id_Estados INT IDENTITY(1,1) PRIMARY KEY,
    descripcion NVARCHAR(50) NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
	date_create DATETIME NOT NULL DEFAULT GETDATE(),
	date_Modify DATETIME NOT NULL DEFAULT GETDATE()
);