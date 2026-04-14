
CREATE PROCEDURE sp_meta_costo_consultar
    @anio INT
AS
BEGIN
    SELECT 
        mes,
        valor
    FROM metas_costo_directo
    WHERE anio = @anio
    ORDER BY mes;
END

