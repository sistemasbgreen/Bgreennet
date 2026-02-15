-- =============================================
-- SP para ACTUALIZAR un pulso (todos los campos)
-- =============================================
CREATE PROCEDURE [dbo].[sp_Pulsos_Actualizar]
    @id_pulso INT,
    @titulo NVARCHAR(255) = NULL,
    @descripcion NVARCHAR(MAX) = NULL,
    @imagen_url NVARCHAR(500) = NULL,
    @imagen_nombre_original NVARCHAR(255) = NULL,
    @imagen_tipo_mime NVARCHAR(100) = NULL,
    @imagen_tamano_bytes INT = NULL,
    @Fecha_Final DATETIME = NULL,
    @activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        UPDATE [dbo].[Pulsos]
        SET 
            [titulo] = ISNULL(@titulo, [titulo]),
            [descripcion] = ISNULL(@descripcion, [descripcion]),
            [imagen_url] = ISNULL(@imagen_url, [imagen_url]),
            [imagen_nombre_original] = ISNULL(@imagen_nombre_original, [imagen_nombre_original]),
            [imagen_tipo_mime] = ISNULL(@imagen_tipo_mime, [imagen_tipo_mime]),
            [imagen_tamano_bytes] = ISNULL(@imagen_tamano_bytes, [imagen_tamano_bytes]),
            [Fecha_Final] = ISNULL(@Fecha_Final, [Fecha_Final]),
            [activo] = ISNULL(@activo, [activo]),
            [date_Modify] = GETDATE()
        WHERE [id_pulso] = @id_pulso;
        
        -- Verificar si se actualizó algún registro
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR('No se encontró ningún pulso con el ID especificado', 16, 1);
        END
        
        COMMIT TRANSACTION;
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