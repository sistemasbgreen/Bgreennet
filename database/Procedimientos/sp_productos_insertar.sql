IF OBJECT_ID('sp_productos_insertar') IS NOT NULL
    DROP PROCEDURE sp_productos_insertar;
GO

CREATE PROCEDURE sp_productos_insertar
    @id VARCHAR(50),
    @nombre VARCHAR(150),
    @id_producto_siesa VARCHAR(50) = NULL,
    @usuario VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar si ya existe por ID
    IF EXISTS (
        SELECT 1 
        FROM productos 
        WHERE id = @id
    )
    BEGIN
        RAISERROR('El producto ya existe', 16, 1);
        RETURN;
    END

    -- Validar si ya existe por nombre (opcional pero recomendado)
    IF EXISTS (
        SELECT 1 
        FROM productos 
        WHERE nombre = @nombre
    )
    BEGIN
        RAISERROR('Ya existe un producto con ese nombre', 16, 1);
        RETURN;
    END

    -- Insertar producto
    INSERT INTO productos (
        id,
        nombre,
        id_producto_siesa,
        date_create,
        date_Modify
    )
    VALUES (
        @id,
        @nombre,
        @id_producto_siesa,
        GETDATE(),
        GETDATE()
    );

    -- Retornar el producto insertado
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