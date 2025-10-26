/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 24/10/2025
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    24/10/2025      Creacion de tablas Permiso

***************************/
use BgreenNet_Dev;

CREATE TABLE Permiso (
    id_permiso INT IDENTITY(1,1) PRIMARY KEY,
    id_perfil_fk INT NOT NULL,
    id_sub_modulo_fk INT NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    descripcion NVARCHAR(255) NULL,
	date_create DATETIME NOT NULL DEFAULT GETDATE(),
	date_Modify DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (id_perfil_fk) REFERENCES Perfil(id_perfil),
    FOREIGN KEY (id_sub_modulo_fk) REFERENCES Sub_Modulo(id_sub_modulo)
);