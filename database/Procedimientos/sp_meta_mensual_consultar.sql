





CREATE PROCEDURE sp_meta_mensual_consultar
    @producto_id VARCHAR(10),
    @anio INT
AS
BEGIN
    SELECT 
        mes,
        valor,
        creado_en AS date_create,
        creado_en AS date_Modify,
        creado_por
    FROM metas_mensuales
    WHERE producto_id = @producto_id
    AND anio = @anio
    ORDER BY mes;
END
