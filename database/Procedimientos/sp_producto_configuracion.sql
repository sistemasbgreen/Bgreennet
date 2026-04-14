






CREATE PROCEDURE sp_producto_configuracion
AS
BEGIN
   SELECT 
        p.id,
        p.nombre,
		p.id_producto_siesa,
        tm.codigo AS tipo_movimiento,
        td.codigo AS tipo_documento
    FROM productos p
    LEFT JOIN producto_tipos_documento ptd 
        ON p.id = ptd.producto_id
    LEFT JOIN tipos_documento td 
        ON td.id = ptd.tipo_documento_id
    LEFT JOIN tipo_movimiento tm 
        ON tm.id = ptd.tipo_movimiento_id
    WHERE p.activo = 1
    ORDER BY p.id;
END