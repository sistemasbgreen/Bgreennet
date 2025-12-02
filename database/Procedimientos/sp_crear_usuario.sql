USE [BgreenNet_Dev]
GO
create procedure sp_crear_usuario
    @usuario NVARCHAR(50),
    @contrasena NVARCHAR(255),
    @id_area int,
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
    @ultima_conexion DATETIME = NULL,
    @estado BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
	 
    BEGIN TRY
        -- Si no se pasa fecha, se asigna la hora actual

        IF @ultima_conexion IS NULL
            SET @ultima_conexion = GETDATE();

        -- Insertar en Usuario primero
        INSERT INTO Usuario (
            usuario, contrasena, activo, ultima_conexion,
            Id_perfil_fk, Id_empresa_fk, Id_area_fk , Id_cargo_fk
        )
        VALUES (
            @usuario, @contrasena, @estado, @ultima_conexion,
            @id_perfil, @id_empresa, @id_area ,@id_cargo
        );

        DECLARE @id_usuario INT = SCOPE_IDENTITY();

        -- Insertar en DetalleUsuario con referencia al usuario
        INSERT INTO DetalleUsuario (
            Id_usuario_fk, Id_tipoidentificacion_fk , identificacion, nombre, apellido, razon_social,
            correo, celular, fecha_nacimiento, activo
        )
        VALUES (
            @id_usuario,@id_tipoidentificacion , @identificacion, @nombre, @apellido, @razon_social,
            @correo, @celular, @fecha_nacimiento, @estado
        );


        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH

END;



