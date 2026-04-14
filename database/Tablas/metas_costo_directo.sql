use BgreenNet_Dev;

CREATE TABLE metas_costo_directo (
    id INT IDENTITY PRIMARY KEY,
    anio INT NOT NULL,
    mes INT NOT NULL,
    valor DECIMAL(18,4) NOT NULL,

    creado_en DATETIME DEFAULT GETDATE(),
    creado_por VARCHAR(50),

    CONSTRAINT UQ_meta_costo UNIQUE (anio, mes)
);