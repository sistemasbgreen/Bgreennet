




CREATE PROCEDURE sp_producto_tipo_doc_insertar
    @producto_id VARCHAR(10),
    @tipo_documento_id INT,
    @tipo_movimiento_id INT
AS
BEGIN
    INSERT INTO producto_tipos_documento (
        producto_id,
        tipo_documento_id,
        tipo_movimiento_id
    )
    VALUES (
        @producto_id,
        @tipo_documento_id,
        @tipo_movimiento_id
    );
END