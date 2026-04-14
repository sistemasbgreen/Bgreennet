




CREATE PROCEDURE sp_producto_listar
AS
BEGIN
    SELECT id, nombre, id_producto_siesa, activo
    FROM productos
    WHERE activo = 1;
END