CREATE PROCEDURE dbo.sp_Pulsos_ConsultarPorId
    @id_pulso INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        p.id_pulso,
        p.titulo,
        p.descripcion,
        p.imagen_url,
        p.imagen_nombre_original,
        p.imagen_tipo_mime,
        p.imagen_tamano_bytes,
        p.fecha_final,
        p.date_Create,
        p.date_Modify,
        p.activo,
        p.creado_por
    FROM dbo.Pulsos p
    WHERE p.id_pulso = @id_pulso;
END
GO
