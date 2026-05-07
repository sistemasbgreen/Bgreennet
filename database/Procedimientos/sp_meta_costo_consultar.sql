
CREATE PROCEDURE sp_meta_costo_consultar
    @anio INT
AS
BEGIN
    SELECT 
        mes,
        valor,
        creado_en AS date_create,
        creado_en AS date_Modify,
        creado_por
    FROM metas_costo_directo
    WHERE anio = @anio
    ORDER BY mes;
END

