/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 24/10/2025
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    24/10/2025      Creacion de tablas Acciones

***************************/
use BgreenNet_Dev;

CREATE TABLE Acciones (
    id_accion INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(255) NULL,
    id_permiso_fk INT NOT NULL,
    FOREIGN KEY (id_permiso_fk) REFERENCES Permiso(id_permiso)
);