CREATE TRIGGER trg_tareas_estado
ON tareas
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO tareas_historial (
        id_tarea, id_estado_anterior, id_estado_nuevo
    )
    SELECT 
        i.id_tarea,
        d.id_estado,
        i.id_estado
    FROM inserted i
    INNER JOIN deleted d 
        ON i.id_tarea = d.id_tarea
    WHERE i.id_estado <> d.id_estado;
END;
