package com.bgreenNet.bgreenNet.services;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bgreenNet.bgreenNet.dto.LoginRequestDTO;
import com.bgreenNet.bgreenNet.dto.LoginResponseDTO;
import com.bgreenNet.bgreenNet.jwt.JwtUtil;
import com.bgreenNet.bgreenNet.models.ConfiguracionSeguridad;
import com.bgreenNet.bgreenNet.models.PasswordResetToken;
import com.bgreenNet.bgreenNet.models.Usuario;
import com.bgreenNet.bgreenNet.repository.PasswordResetTokenRepository;
import com.bgreenNet.bgreenNet.repository.UsuarioRepository;

import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class PasswordResetService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordResetTokenRepository resetTokenRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ConfiguracionSeguridadService configuracionSeguridadService;

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${report.email.from:notificacionesbgreennet@bgreen.com.co}")
    private String emailFrom;

    private static final SecureRandom random = new SecureRandom();

    @PostConstruct
    public void init() {
        try {
            jdbcTemplate.execute("""
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
                END
            """);
            System.out.println("[PasswordResetService] Tabla PasswordResetToken verificada/creada correctamente.");
        } catch (Exception e) {
            System.err.println("[PasswordResetService] Aviso al inicializar la tabla PasswordResetToken: " + e.getMessage());
        }
    }

    public Optional<Usuario> buscarUsuario(String usuarioOCorreo) {
        if (usuarioOCorreo == null || usuarioOCorreo.trim().isEmpty()) {
            return Optional.empty();
        }
        String val = usuarioOCorreo.trim();

        // 1. Buscar directamente por nombre de usuario
        Optional<Usuario> userOpt = usuarioRepository.findByUsuario(val);
        if (userOpt.isPresent()) {
            return userOpt;
        }

        // 2. Buscar por correo en DetalleUsuario
        String sql = """
            SELECT u.usuario
            FROM Usuario u
            LEFT JOIN DetalleUsuario du ON du.id_usuario_fk = u.id_usuario
            WHERE du.correo = ? OR u.usuario = ?
        """;
        List<String> usernames = jdbcTemplate.queryForList(sql, String.class, val, val);
        if (!usernames.isEmpty()) {
            return usuarioRepository.findByUsuario(usernames.get(0));
        }

        return Optional.empty();
    }

    public void solicitarCodigo(String usuarioOCorreo) {
        String val = usuarioOCorreo != null ? usuarioOCorreo.trim() : "";
        if (val.isEmpty()) {
            throw new IllegalArgumentException("Por favor ingrese su usuario o correo electrónico");
        }

        Optional<Usuario> usuarioOpt = buscarUsuario(val);
        if (usuarioOpt.isEmpty()) {
            throw new IllegalArgumentException("No se encontró ningún usuario registrado con esa información");
        }

        Usuario usuario = usuarioOpt.get();
        if (usuario.getActivo() != null && usuario.getActivo() == 0) {
            throw new IllegalArgumentException("La cuenta de usuario se encuentra inactiva");
        }

        // Obtener correo del detalle del usuario
        String sqlCorreo = """
            SELECT du.correo
            FROM DetalleUsuario du
            WHERE du.id_usuario_fk = ?
        """;
        List<String> correos = jdbcTemplate.queryForList(sqlCorreo, String.class, usuario.getIdUsuario());
        String correo = (!correos.isEmpty() && correos.get(0) != null) ? correos.get(0).trim() : null;

        if (correo == null || correo.isEmpty()) {
            throw new IllegalArgumentException("El usuario '" + usuario.getUsuario() + "' no tiene un correo electrónico registrado en el sistema. Contacte al administrador.");
        }

        // 1. Guardar token OTP en transacción corta de BD
        String codigoOtp = generarYGuardarToken(usuario);

        // 2. Enviar correo electrónico fuera de la transacción de BD
        enviarCorreoCodigo(correo, usuario.getUsuario(), codigoOtp);
    }

    @Transactional
    public String generarYGuardarToken(Usuario usuario) {
        // Invalidar tokens anteriores
        List<PasswordResetToken> tokensAnteriores = resetTokenRepository.findByUsuarioAndUsadoFalse(usuario);
        for (PasswordResetToken t : tokensAnteriores) {
            t.setUsado(true);
        }
        if (!tokensAnteriores.isEmpty()) {
            resetTokenRepository.saveAll(tokensAnteriores);
        }

        // Generar nuevo código de 6 dígitos
        String codigoOtp = String.format("%06d", random.nextInt(1000000));

        PasswordResetToken token = PasswordResetToken.builder()
                .usuario(usuario)
                .codigoOtp(codigoOtp)
                .fechaExpiracion(LocalDateTime.now().plusMinutes(15))
                .usado(false)
                .intentos(0)
                .fechaCreacion(LocalDateTime.now())
                .build();

        resetTokenRepository.save(token);
        return codigoOtp;
    }

    @Transactional(readOnly = true)
    public boolean validarCodigo(String usuarioOCorreo, String codigo) {
        if (usuarioOCorreo == null || codigo == null || codigo.trim().isEmpty()) {
            return false;
        }

        Optional<Usuario> usuarioOpt = buscarUsuario(usuarioOCorreo);
        if (usuarioOpt.isEmpty()) {
            return false;
        }

        Usuario usuario = usuarioOpt.get();
        Optional<PasswordResetToken> tokenOpt = resetTokenRepository
                .findTopByUsuarioAndCodigoOtpAndUsadoFalseOrderByFechaCreacionDesc(usuario, codigo.trim());

        if (tokenOpt.isEmpty()) {
            return false;
        }

        PasswordResetToken token = tokenOpt.get();

        if (token.getFechaExpiracion().isBefore(LocalDateTime.now())) {
            return false;
        }

        return true;
    }

    @Transactional
    public LoginResponseDTO restablecerClave(String usuarioOCorreo, String codigo, String nuevaContrasena) {
        if (usuarioOCorreo == null || usuarioOCorreo.trim().isEmpty()) {
            throw new IllegalArgumentException("Usuario o correo inválido");
        }
        if (nuevaContrasena == null || nuevaContrasena.trim().isEmpty()) {
            throw new IllegalArgumentException("La nueva contraseña no puede estar vacía");
        }

        Optional<Usuario> usuarioOpt = buscarUsuario(usuarioOCorreo);
        if (usuarioOpt.isEmpty()) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }

        Usuario usuario = usuarioOpt.get();
        Optional<PasswordResetToken> tokenOpt = resetTokenRepository
                .findTopByUsuarioAndCodigoOtpAndUsadoFalseOrderByFechaCreacionDesc(usuario, codigo.trim());

        if (tokenOpt.isEmpty()) {
            throw new IllegalArgumentException("El código de verificación es incorrecto o ya fue utilizado");
        }

        PasswordResetToken token = tokenOpt.get();

        if (token.getFechaExpiracion().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("El código de verificación ha expirado. Por favor solicite uno nuevo.");
        }

        // Verificar política de seguridad de la nueva contraseña
        ConfiguracionSeguridad config = configuracionSeguridadService.obtenerConfiguracion();
        if (config != null) {
            if (config.getMinCaracteres() > 0 && nuevaContrasena.length() < config.getMinCaracteres()) {
                throw new IllegalArgumentException("La contraseña debe tener al menos " + config.getMinCaracteres() + " caracteres");
            }
            if (config.getRequiereLetras() && !nuevaContrasena.matches(".*[a-zA-Z].*")) {
                throw new IllegalArgumentException("La contraseña debe contener al menos una letra");
            }
            if (config.getRequiereNumeros() && !nuevaContrasena.matches(".*[0-9].*")) {
                throw new IllegalArgumentException("La contraseña debe contener al menos un número");
            }
            if (config.getRequiereEspeciales() && !nuevaContrasena.matches(".*[!@#$%^&*(),.?\":{}|<>].*")) {
                throw new IllegalArgumentException("La contraseña debe contener al menos un carácter especial (!@#$%^&*)");
            }
        }

        // Marcar token como usado
        token.setUsado(true);
        resetTokenRepository.save(token);

        // Actualizar clave del usuario y desbloquear si estaba bloqueado
        usuario.setContrasena(passwordEncoder.encode(nuevaContrasena));
        usuario.setFechaActualizacionContrasena(LocalDateTime.now());
        usuario.setIntentosFallidos(0);
        usuario.setBloqueado(false);
        usuarioRepository.save(usuario);

        // Generar respuesta de login directo
        LoginRequestDTO loginReq = new LoginRequestDTO();
        loginReq.setUsuario(usuario.getUsuario());
        LoginResponseDTO response = authService.login(loginReq);

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(usuario.getUsuario());
        String jwtToken = jwtUtil.generateToken(userDetails);

        response.setToken(jwtToken);
        response.setContrasenaExpirada(false);

        return response;
    }

    private void enviarCorreoCodigo(String correo, String usuario, String codigoOtp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(emailFrom);
            helper.setTo(correo);
            helper.setSubject("🔒 Código de Recuperación de Contraseña - BGREENNET");

            String html = """
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
                        .container { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                        .header { background: #006c2c; color: #ffffff; padding: 25px; text-align: center; }
                        .header img { height: 50px; margin-bottom: 10px; }
                        .header h2 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px; }
                        .content { padding: 30px; color: #333333; line-height: 1.6; }
                        .otp-box { background: #e8f5e9; border: 2px dashed #006c2c; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
                        .otp-code { font-size: 32px; font-weight: 700; color: #006c2c; letter-spacing: 8px; }
                        .footer { background: #fafafa; border-top: 1px solid #eeeeee; padding: 15px; text-align: center; font-size: 12px; color: #888888; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="https://bgreen.com.co/Img/bgreen_Logo.png" alt="BGREEN Logo">
                            <h2>BGREENNET</h2>
                        </div>
                        <div class="content">
                            <p>Hola <strong>%s</strong>,</p>
                            <p>Hemos recibido una solicitud para restablecer tu contraseña de acceso a <strong>BGREENNET</strong>.</p>
                            <p>Utiliza el siguiente código de verificación dinámico para continuar con el proceso:</p>
                            <div class="otp-box">
                                <div class="otp-code">%s</div>
                            </div>
                            <p style="font-size: 13px; color: #666;">⏱️ Este código es válido durante <strong>15 minutos</strong> y puede utilizarse una sola vez.</p>
                            <p style="font-size: 12px; color: #999; margin-top: 25px;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
                        </div>
                        <div class="footer">
                            BGREEN S.A.S. · Departamento de TIC
                        </div>
                    </div>
                </body>
                </html>
            """.formatted(usuario, codigoOtp);

            helper.setText(html, true);
            mailSender.send(message);

            System.out.println("[PasswordResetService] ✅ Código OTP enviado con éxito a: " + correo);
        } catch (Exception e) {
            System.err.println("[PasswordResetService] ❌ Error enviando correo OTP: " + e.getMessage());
            e.printStackTrace();
            throw new IllegalArgumentException("No se pudo enviar el correo de verificación (" + e.getMessage() + "). Verifique la configuración de correo.");
        }
    }
}
