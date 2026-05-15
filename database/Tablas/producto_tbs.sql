

CREATE TABLE [dbo].[productos_tbs] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,       -- ID interno de esta tabla de mapeo
    [id_tbs_producto] INT NOT NULL,           -- FK hacia productos(id) (Ej: 10)
    [id_producto_tbs] VARCHAR(50) NOT NULL,   -- ID en el sistema externo/ERP (Ej: 2350)
    [descripcion] VARCHAR(255),               -- Descripción del mapeo o producto
    [id_tbs_tipodoc] VARCHAR(20),             -- Tipo de documento / BWART (ej: '261')
    [datecreate] DATETIME DEFAULT GETDATE(),  -- Fecha de creación
    [datemodify] DATETIME DEFAULT GETDATE(),  -- Fecha de modificación
    [usuario_creacion] VARCHAR(100),          -- Usuario que realizó el registro
    [estado] BIT DEFAULT 1,                   -- 1: Activo, 0: Inactivo

);


ALTER TABLE productos_tbs
ALTER COLUMN id_tbs_producto VARCHAR(10) NOT NULL;

ALTER TABLE productos_tbs
ADD CONSTRAINT FK_productos_tbs_productos
FOREIGN KEY (id_tbs_producto)
REFERENCES productos(id);

-- Índices para optimizar la relación y las búsquedas
CREATE INDEX IX_productos_tbs_fk ON [dbo].[productos_tbs] ([id_tbs_producto]);
CREATE INDEX IX_productos_tbs_externo ON [dbo].[productos_tbs] ([id_producto_tbs]);