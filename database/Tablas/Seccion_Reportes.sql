
-- 1. Crear la tabla de secciones de reporte con campos de auditoría
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('secciones_reporte') AND type in ('U'))
BEGIN
    CREATE TABLE secciones_reporte (
        id INT PRIMARY KEY, 
        nombre VARCHAR(100),
        date_create DATETIME DEFAULT GETDATE(),
        date_modify DATETIME NULL
    ); 
    
    -- Insertar secciones iniciales
    INSERT INTO secciones_reporte (id, nombre, date_create) VALUES 
    (1, 'Biodiesel', GETDATE()), 
    (2, 'Glicerina', GETDATE());
END
GO


-- 2. Añadir la columna de 'seccion_id' (llave foránea) a la tabla productos
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'seccion_id' AND Object_ID = Object_ID(N'productos'))
BEGIN
    ALTER TABLE productos 
    ADD seccion_id INT NULL, 
    CONSTRAINT FK_productos_seccion FOREIGN KEY (seccion_id) REFERENCES secciones_reporte(id);
END
GO
-- 3. Añadir la columna de 'orden_reporte' a la tabla productos
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'orden_reporte' AND Object_ID = Object_ID(N'productos'))
BEGIN
    ALTER TABLE productos 
    ADD orden_reporte INT NULL;
END
GO