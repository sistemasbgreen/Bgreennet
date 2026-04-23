use BgreenNet_Dev;

CREATE TABLE productos (
    id VARCHAR(10) PRIMARY KEY,           
    nombre VARCHAR(100) NOT NULL,
    id_producto_siesa VARCHAR(20) NULL,
    activo BIT DEFAULT 1,
    usa_suma BIT DEFAULT 0,
    date_create DATETIME DEFAULT GETDATE(),
    date_Modify DATETIME DEFAULT GETDATE()
);