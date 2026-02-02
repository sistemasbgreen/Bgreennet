SELECT 
    t.id_tarea,
    t.titulo,
    pt.nombre AS prioridad,
    pt.minutos_recordatorio,
    pt.color_rgb,
    t.ultima_notificacion
FROM tareas t
INNER JOIN prioridadesTarea pt ON t.id_prioridad = pt.id_prioridad
INNER JOIN estadosTarea et ON t.id_estado = et.id_estado
WHERE et.nombre IN ('CREADA', 'INICIADA')
AND (
    t.ultima_notificacion IS NULL
    OR DATEADD(MINUTE, pt.minutos_recordatorio, t.ultima_notificacion) <= SYSDATETIME()
);
