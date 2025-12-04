/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 2/12/2025
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    2/12/2025      Creacion de tablas Tipo sistema

***************************/
use BgreenNet_Dev;

CREATE TABLE tipo_sistema (
    id_tipo_sistema INT PRIMARY KEY IDENTITY(1,1),
    nombre_tipo NVARCHAR(50) NOT NULL UNIQUE,
    activo BIT NOT NULL DEFAULT 1,
    date_create DATETIME NOT NULL DEFAULT GETDATE()
);