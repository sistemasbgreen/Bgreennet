
CREATE PROCEDURE sp_producto_tipo_doc_eliminar_por_producto
    @producto_id VARCHAR(10)
AS
BEGIN
    DELETE FROM producto_tipos_documento
    WHERE producto_id = @producto_id;
END
GO