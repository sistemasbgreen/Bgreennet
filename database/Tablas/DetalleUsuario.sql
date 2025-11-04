/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 24/10/2025
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    24/10/2025      Creacion de tablas Modulo

***************************/
use BgreenNet_Dev;

CREATE TABLE [dbo].[DetalleUsuario] (
    [id_detalle_usuario] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [id_usuario_fk] INT NOT NULL,
    [id_tipoidentificacion_fk] INT NOT NULL,
    [identificacion] NVARCHAR(50) NOT NULL,
    [nombre] NVARCHAR(100) NOT NULL,
    [apellido] NVARCHAR(100) NOT NULL,
    [razon_social] NVARCHAR(150) NOT NULL,
    [correo] NVARCHAR(100) NOT NULL,
    [celular] NVARCHAR(20) NOT NULL,
    [activo] BIT NOT NULL DEFAULT 1,
    [fecha_nacimiento] DATE NULL,
    [date_create] DATETIME NOT NULL DEFAULT GETDATE(),
    [date_modify] DATETIME NOT NULL DEFAULT GETDATE(),
    [id_direccion_fk] INT NULL, -- <-- agregado si quieres relacionar con la tabla Direccion
    CONSTRAINT [FK_DetalleUsuario_Usuario] FOREIGN KEY ([id_usuario_fk]) 
        REFERENCES [dbo].[Usuario]([id_usuario]),
    CONSTRAINT [FK_DetalleUsuario_TipoIdentificacion] FOREIGN KEY ([id_tipoidentificacion_fk]) 
        REFERENCES [dbo].[TipoIdentificacion]([id_tipoidentificacion]),
    CONSTRAINT [FK_DetalleUsuario_Direccion] FOREIGN KEY ([id_direccion_fk]) 
        REFERENCES [dbo].[Direccion]([id_direccion])
);

