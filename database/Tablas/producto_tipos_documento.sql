use BgreenNet_Dev;


CREATE TABLE producto_tipos_documento (
    id INT IDENTITY PRIMARY KEY,
    producto_id VARCHAR(50) NOT NULL,
    tipo_documento_id INT NOT NULL,
    tipo_movimiento_id INT NOT NULL,
    date_create DATETIME DEFAULT GETDATE(),
    date_Modify DATETIME DEFAULT GETDATE(),
    orden INT DEFAULT 0,
    producto_origen_id VARCHAR(50) NULL,

    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id),
    FOREIGN KEY (tipo_movimiento_id) REFERENCES tipo_movimiento(id),

    UNIQUE(producto_id, tipo_documento_id, tipo_movimiento_id)
);



-- 1. Agregar la columna date_create con valor por defecto
ALTER TABLE [dbo].[producto_tipos_documento]
ADD [date_create] DATETIME DEFAULT GETDATE();
GO

-- 2. Agregar la columna date_Modify con valor por defecto
ALTER TABLE [dbo].[producto_tipos_documento]
ADD [date_Modify] DATETIME DEFAULT GETDATE();
GO

-- 3. Agregar la columna orden con valor por defecto 0
ALTER TABLE [dbo].[producto_tipos_documento]
ADD [orden] INT DEFAULT 0;
GO

-- 4. Agregar la columna producto_origen_id (permite nulos)
ALTER TABLE [dbo].[producto_tipos_documento]
ADD [producto_origen_id] VARCHAR(50) NULL;
GO