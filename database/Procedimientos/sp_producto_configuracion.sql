-- 1. CREA LA COLUMNA (Sin esto, el programa da error al intentar guardar)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('productos') AND name = 'usa_suma')
    ALTER TABLE productos ADD usa_suma BIT DEFAULT 0;
GO

-- 2. ACTUALIZA EL PROCEDIMIENTO (Sin esto, el check siempre aparecerá vacío al recargar)
ALTER PROCEDURE [dbo].[sp_producto_configuracion]
AS
BEGIN
   SELECT 
        p.id,
        p.nombre,
		p.id_producto_siesa,
		p.usa_suma, -- <-- Esto permite que la UI lea el valor guardado
        tm.codigo AS tipo_movimiento,
        tm.id AS tipo_movimiento_id,
        td.codigo AS tipo_documento,
        td.id AS tipo_documento_id
    FROM productos p
    LEFT JOIN producto_tipos_documento ptd ON p.id = ptd.producto_id
    LEFT JOIN tipos_documento td ON td.id = ptd.tipo_documento_id
    LEFT JOIN tipo_movimiento tm ON tm.id = ptd.tipo_movimiento_id
    WHERE p.activo = 1
    ORDER BY p.id;
END
GO
