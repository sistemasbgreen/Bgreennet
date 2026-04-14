use BgreenNet_Dev;


CREATE TABLE producto_tipos_documento (
    id INT IDENTITY PRIMARY KEY,
    producto_id VARCHAR(10) NOT NULL,
    tipo_documento_id INT NOT NULL,
    tipo_movimiento_id INT NOT NULL,

    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id),
    FOREIGN KEY (tipo_movimiento_id) REFERENCES tipo_movimiento(id),

    UNIQUE(producto_id, tipo_documento_id, tipo_movimiento_id)
);