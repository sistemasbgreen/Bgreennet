use BgreenNet_Dev;


CREATE TABLE metas_mensuales (
    id INT IDENTITY PRIMARY KEY,
    producto_id VARCHAR(10) NOT NULL,
    anio INT NOT NULL,
    mes INT NOT NULL, -- 1 a 12
    valor DECIMAL(18,4) NOT NULL,

    creado_en DATETIME DEFAULT GETDATE(),
    creado_por VARCHAR(50),

    FOREIGN KEY (producto_id) REFERENCES productos(id),

    CONSTRAINT UQ_meta_producto UNIQUE (producto_id, anio, mes)
);