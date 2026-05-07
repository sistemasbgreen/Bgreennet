IF OBJECT_ID('sp_productos_actualizar') IS NOT NULL
    DROP PROCEDURE sp_productos_actualizar;
GO

CREATE PROCEDURE sp_productos_actualizar
    @id VARCHAR(50),
    @nombre VARCHAR(150),
    @id_producto_siesa VARCHAR(50) = NULL,
    @usuario VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que exista
    IF NOT EXISTS (
        SELECT 1 
        FROM productos 
        WHERE id = @id
    )
    BEGIN
        RAISERROR('El producto no existe', 16, 1);
        RETURN;
    END

    -- Validar nombre duplicado (en otro producto)
    IF EXISTS (
        SELECT 1 
        FROM productos 
        WHERE nombre = @nombre
        AND id <> @id
    )
    BEGIN
        RAISERROR('Ya existe otro producto con ese nombre', 16, 1);
        RETURN;
    END

    -- Actualizar
    UPDATE productos
    SET 
        nombre = @nombre,
        id_producto_siesa = @id_producto_siesa,
        date_Modify = GETDATE()
    WHERE id = @id;

    -- Retornar el producto actualizado
    SELECT 
        id,
        nombre,
        id_producto_siesa,
        date_create,
        date_Modify
    FROM productos
    WHERE id = @id;
END;
GO