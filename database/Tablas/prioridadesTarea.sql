
CREATE TABLE prioridadesTarea (
    id_prioridad INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(20) NOT NULL UNIQUE,
    minutos_recordatorio INT NOT NULL,
    color_rgb NVARCHAR(20) NOT NULL
);

INSERT INTO prioridadesTarea (nombre, minutos_recordatorio, color_rgb)
VALUES
('ALTA', 30, '255,0,0'),        -- Rojo
('MEDIA', 60, '255,255,0'),    -- Amarillo
('BAJA', 120, '0,0,255');      -- Azul
