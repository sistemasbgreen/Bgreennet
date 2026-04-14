


CREATE PROCEDURE sp_producto_insertar
    @id VARCHAR(10),
    @nombre VARCHAR(100),
    @id_producto_siesa VARCHAR(20) = NULL
AS
BEGIN
    INSERT INTO productos (id, nombre, id_producto_siesa)
    VALUES (@id, @nombre, @id_producto_siesa);
END

