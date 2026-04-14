use BgreenNet_Dev;

CREATE TABLE productos (
    id VARCHAR(10) PRIMARY KEY,           
    nombre VARCHAR(100) NOT NULL,
    id_producto_siesa VARCHAR(20) NULL,
    activo BIT DEFAULT 1
);