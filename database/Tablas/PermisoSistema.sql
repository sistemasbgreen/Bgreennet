/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 24/10/2025
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    24/10/2025      Creacion de tablas PermisoSistema

***************************/
use BgreenNet_Dev;

CREATE TABLE PermisoSistema (
    id_permiso_sistema INT IDENTITY(1,1) PRIMARY KEY,
    id_perfil_fk INT NOT NULL,
    id_sistema_fk INT NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_perfil_fk) REFERENCES Perfil(id_perfil),
    FOREIGN KEY (id_sistema_fk) REFERENCES SistemaInformacion(id_sistema)
);