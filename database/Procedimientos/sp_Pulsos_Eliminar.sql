CREATE PROCEDURE [dbo].[sp_Pulsos_Eliminar]
    @id_pulso INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Soft delete: cambiar activo a 0 en lugar de borrar físicamente
        UPDATE [dbo].[Pulsos]
        SET 
            [activo] = 0,
            [date_Modify] = GETDATE()
        WHERE [id_pulso] = @id_pulso;
        
        -- Verificar si se actualizó algún registro
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR('No se encontró ningún pulso con el ID especificado', 16, 1);
        END
        
        COMMIT TRANSACTION;
        
        SELECT 'Pulso eliminado correctamente' AS mensaje;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO