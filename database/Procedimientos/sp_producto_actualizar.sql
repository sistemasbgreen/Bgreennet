


CREATE PROCEDURE sp_producto_actualizar
    @id VARCHAR(10),
    @nombre VARCHAR(100),
    @id_producto_siesa VARCHAR(20),
    @activo BIT
AS
BEGIN
    UPDATE productos
    SET nombre = @nombre,
        id_producto_siesa = @id_producto_siesa,
        activo = @activo
    WHERE id = @id;
END