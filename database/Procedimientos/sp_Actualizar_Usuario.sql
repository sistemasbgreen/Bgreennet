USE BgreenNet_Dev;
GO

CREATE PROCEDURE dbo.sp_actualizar_usuario
    @id_usuario INT,
    @id_detalleusuario INT,
    @usuario NVARCHAR(50),
    @contrasena NVARCHAR(255),
    @id_area INT,
    @id_perfil INT,
    @id_cargo INT,
    @identificacion NVARCHAR(50),
    @nombre NVARCHAR(100),
    @apellido NVARCHAR(100),
    @razon_social NVARCHAR(255) = NULL,
    @correo NVARCHAR(100),
    @celular NVARCHAR(20),
    @fecha_nacimiento DATE,
    @id_empresa INT,
    @id_tipoidentificacion INT,
    @activo BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        UPDATE DetalleUsuario
        SET
            Id_tipoidentificacion_fk = @id_tipoidentificacion,
            identificacion = @identificacion,
            nombre = @nombre,
            apellido = @apellido,
            razon_social = @razon_social,
            correo = @correo,
            celular = @celular,
            fecha_nacimiento = @fecha_nacimiento,
            activo = @activo
        WHERE Id_detalle_usuario = @id_detalleusuario;

        UPDATE Usuario
        SET
            usuario = @usuario,
            contrasena = @contrasena,
            Id_area_fk = @id_area,
            Id_perfil_fk = @id_perfil,
            Id_cargo_fk = @id_cargo,
            Id_empresa_fk = @id_empresa,
            activo = @activo
        WHERE Id_usuario = @id_usuario;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO