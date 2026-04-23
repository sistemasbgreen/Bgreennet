USE BgreenNet_Dev;
CREATE TABLE producto_componentes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    producto_padre_id VARCHAR(10) NOT NULL,
    producto_hijo_siesa_id VARCHAR(20) NOT NULL,
    usa_suma BIT DEFAULT 0,
    activo BIT DEFAULT 1,
    date_create DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (producto_padre_id) REFERENCES productos(id)
);