

CREATE PROCEDURE sp_meta_mensual_array
    @producto_id VARCHAR(10),
    @anio INT
AS
BEGIN
    SELECT 
        ISNULL([1],0) AS Enero,
        ISNULL([2],0) AS Febrero,
        ISNULL([3],0) AS Marzo,
        ISNULL([4],0) AS Abril,
        ISNULL([5],0) AS Mayo,
        ISNULL([6],0) AS Junio,
        ISNULL([7],0) AS Julio,
        ISNULL([8],0) AS Agosto,
        ISNULL([9],0) AS Septiembre,
        ISNULL([10],0) AS Octubre,
        ISNULL([11],0) AS Noviembre,
        ISNULL([12],0) AS Diciembre
    FROM (
        SELECT mes, valor
        FROM metas_mensuales
        WHERE producto_id = @producto_id
        AND anio = @anio
    ) src
    PIVOT (
        MAX(valor) FOR mes IN ([1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12])
    ) pvt;
END

