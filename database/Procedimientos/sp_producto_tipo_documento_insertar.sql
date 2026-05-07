
IF OBJECT_ID('sp_producto_tipo_documento_insertar') IS NOT NULL
    DROP PROCEDURE sp_producto_tipo_documento_insertar;
GO

CREATE PROCEDURE sp_producto_tipo_documento_insertar
    @producto_id VARCHAR(50),
    @tipo_documento_codigo VARCHAR(10),
    @tipo_movimiento_codigo VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @tipo_documento_id INT;
    DECLARE @tipo_movimiento_id INT;

    SELECT @tipo_documento_id = id 
    FROM tipos_documento 
    WHERE codigo = @tipo_documento_codigo;

    SELECT @tipo_movimiento_id = id 
    FROM tipo_movimiento 
    WHERE codigo = @tipo_movimiento_codigo;

    IF @tipo_documento_id IS NULL OR @tipo_movimiento_id IS NULL
    BEGIN
        RAISERROR('Tipo documento o movimiento no existe', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1 
        FROM producto_tipos_documento 
        WHERE producto_id = @producto_id
        AND tipo_documento_id = @tipo_documento_id
        AND tipo_movimiento_id = @tipo_movimiento_id
    )
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
END;
GO