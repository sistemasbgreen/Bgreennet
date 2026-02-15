/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 10/02/2026
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    10/02/2026      Creacion de tablas PermisoSubModulo

***************************/


IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PermisoSubModulo')
BEGIN
    PRINT 'Creando tabla PermisoSubModulo...';
    
    CREATE TABLE PermisoSubModulo (
        id_permiso_submodulo INT PRIMARY KEY IDENTITY(1,1),
        id_perfil_fk INT NOT NULL,
        id_submodulo_fk INT NOT NULL,
        activo BIT NOT NULL DEFAULT 1,
        fecha_asignacion DATETIME DEFAULT GETDATE(),
        
        -- Relaciones
        CONSTRAINT FK_PermisoSubModulo_Perfil 
            FOREIGN KEY (id_perfil_fk) REFERENCES Perfil(id_perfil)
            ON DELETE CASCADE,
        CONSTRAINT FK_PermisoSubModulo_SubModulo 
            FOREIGN KEY (id_submodulo_fk) REFERENCES Sub_Modulo(id_sub_modulo)
            ON DELETE CASCADE,
        
        -- Evitar duplicados
        CONSTRAINT UQ_PermisoSubModulo UNIQUE (id_perfil_fk, id_submodulo_fk)
    );
    
    PRINT 'Tabla PermisoSubModulo creada exitosamente';
    
    -- �ndices para mejor rendimiento
    CREATE INDEX IX_PermisoSubModulo_Perfil ON PermisoSubModulo(id_perfil_fk);
    CREATE INDEX IX_PermisoSubModulo_SubModulo ON PermisoSubModulo(id_submodulo_fk);
    CREATE INDEX IX_PermisoSubModulo_Activo ON PermisoSubModulo(activo);
    
    PRINT '�ndices creados';
END
ELSE
BEGIN
    PRINT 'Tabla PermisoSubModulo ya existe';
END