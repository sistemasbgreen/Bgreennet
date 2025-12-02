
USE BgreenNet_Dev
GO
create procedure sp_eliminar_usuario
    @id_usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Primero eliminar DetalleUsuario (por FK)
        DELETE FROM DetalleUsuario WHERE Id_usuario_fk = @id_usuario;
        -- Luego eliminar Usuario
        DELETE FROM Usuario WHERE Id_usuario = @id_usuario;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END