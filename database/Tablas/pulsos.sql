/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 10/02/2026
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    10/02/2026      Creacion de tablas Pulsos

***************************/

CREATE TABLE [dbo].[Pulsos](
    [id_pulso] INT IDENTITY(1,1) NOT NULL,
    [titulo] NVARCHAR(255) NOT NULL,
    [descripcion] NVARCHAR(MAX) NULL,
    [imagen_url] NVARCHAR(500) NULL,           -- ✅ Llenado automático: ruta donde se guarda la imagen
    [imagen_nombre_original] NVARCHAR(255) NULL, -- ✅ Llenado automático: nombre original del archivo
    [imagen_tipo_mime] NVARCHAR(100) NULL,       -- ✅ Llenado automático: tipo MIME (image/jpeg, image/png)
    [imagen_tamano_bytes] INT NULL,              -- ✅ Llenado automático: tamaño en bytes
    [Fecha_Final] DATETIME NOT NULL,
    [date_create] DATETIME NOT NULL CONSTRAINT [DF_Pulsos_date_create] DEFAULT (GETDATE()),
    [date_Modify] DATETIME NOT NULL CONSTRAINT [DF_Pulsos_date_Modify] DEFAULT (GETDATE()),
    [activo] BIT NOT NULL CONSTRAINT [DF_Pulsos_activo] DEFAULT (1),
    [creado_por] NVARCHAR(100) NOT NULL,
    
    CONSTRAINT [PK_Pulsos] PRIMARY KEY CLUSTERED ([id_pulso] ASC)
) ON [PRIMARY]
GO