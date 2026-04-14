





CREATE PROCEDURE sp_meta_costo_guardar
    @anio INT,
    @mes INT,
    @valor DECIMAL(18,4),
    @usuario VARCHAR(50)
AS
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM metas_costo_directo 
        WHERE anio = @anio 
        AND mes = @mes
    )
    BEGIN
        UPDATE metas_costo_directo
        SET valor = @valor,
            creado_por = @usuario,
            creado_en = GETDATE()
        WHERE anio = @anio
        AND mes = @mes;
    END
    ELSE
    BEGIN
        INSERT INTO metas_costo_directo (
            anio, mes, valor, creado_por
        )
        VALUES (
            @anio, @mes, @valor, @usuario
        );
    END
END