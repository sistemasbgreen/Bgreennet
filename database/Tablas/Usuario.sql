/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 24/10/2025
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    24/10/2025      Creacion de tablas Usuario

***************************/
use BgreenNet_Dev;

CREATE TABLE Usuario (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    usuario NVARCHAR(50) NOT NULL,
    contrasena NVARCHAR(255) NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    ultima_conexion DATETIME NULL,
    id_perfil_fk INT NOT NULL,
    id_empresa_fk INT NOT NULL,
    id_area_fk INT NOT NULL,
    id_cargo_fk INT NOT NULL,
	date_create DATETIME NOT NULL DEFAULT GETDATE(),
	date_Modify DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (id_perfil_fk) REFERENCES Perfil(id_perfil),
    FOREIGN KEY (id_empresa_fk) REFERENCES Empresa(id_empresa),
    FOREIGN KEY (id_area_fk) REFERENCES Area(id_area),
    FOREIGN KEY (id_cargo_fk) REFERENCES Cargo(id_cargo)
);
