IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PasswordResetToken]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PasswordResetToken] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [id_usuario_fk] INT NOT NULL,
        [codigo_otp] VARCHAR(6) NOT NULL,
        [fecha_expiracion] DATETIME NOT NULL,
        [usado] BIT DEFAULT 0,
        [intentos] INT DEFAULT 0,
        [fecha_creacion] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_PasswordResetToken_Usuario FOREIGN KEY ([id_usuario_fk]) REFERENCES [dbo].[Usuario]([id_usuario])
    );
END;
