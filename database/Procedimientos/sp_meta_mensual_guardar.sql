






CREATE PROCEDURE sp_meta_mensual_guardar
    @producto_id VARCHAR(10),
    @anio INT,
    @mes INT,
    @valor DECIMAL(18,4),
    @usuario VARCHAR(50)
AS
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM metas_mensuales 
        WHERE producto_id = @producto_id 
        AND anio = @anio 
        AND mes = @mes
    )
    BEGIN
        UPDATE metas_mensuales
        SET valor = @valor,
            creado_por = @usuario,
            creado_en = GETDATE()
        WHERE producto_id = @producto_id
        AND anio = @anio
        AND mes = @mes;
    END
    ELSE
    BEGIN
        INSERT INTO metas_mensuales (
            producto_id, anio, mes, valor, creado_por
        )
        VALUES (
            @producto_id, @anio, @mes, @valor, @usuario
        );
    END
END