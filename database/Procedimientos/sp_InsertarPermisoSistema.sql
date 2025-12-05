CREATE PROCEDURE sp_InsertarPermisoSistema
    @id_perfil_fk INT,
    @id_sistema_fk INT,
    @activo BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        INSERT INTO PermisoSistema (id_perfil_fk, id_sistema_fk, activo)
        VALUES (@id_perfil_fk, @id_sistema_fk, @activo);

        -- Devuelve el ID generado (opcional, útil si necesitas confirmar inserción)
        SELECT SCOPE_IDENTITY() AS id_permiso_sistema_insertado;
    END TRY
    BEGIN CATCH
        -- Manejo básico de errores
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END