use BgreenNet_Dev;

CREATE TABLE productos (
    id VARCHAR(10) PRIMARY KEY,           
    nombre VARCHAR(100) NOT NULL,
    id_producto_siesa VARCHAR(20) NULL,
    activo BIT DEFAULT 1,
    usa_suma BIT DEFAULT 0,
    sentido_meta BIT DEFAULT 1, -- 1: Mayor es mejor (Verde arriba), 0: Menor es mejor (Verde abajo)
    date_create DATETIME DEFAULT GETDATE(),
    date_Modify DATETIME DEFAULT GETDATE()
);