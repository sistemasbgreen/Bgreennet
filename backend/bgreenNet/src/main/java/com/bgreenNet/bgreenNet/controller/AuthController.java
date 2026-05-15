package com.bgreenNet.bgreenNet.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.bgreenNet.bgreenNet.dto.LoginRequestDTO;
import com.bgreenNet.bgreenNet.dto.LoginResponseDTO;
import com.bgreenNet.bgreenNet.jwt.JwtUtil;
import com.bgreenNet.bgreenNet.services.AuthService;
import com.bgreenNet.bgreenNet.services.CustomUserDetailsService;
import com.bgreenNet.bgreenNet.services.ConfiguracionSeguridadService;
import com.bgreenNet.bgreenNet.repository.UsuarioRepository;
import com.bgreenNet.bgreenNet.models.Usuario;
import com.bgreenNet.bgreenNet.models.ConfiguracionSeguridad;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@RestController
@RequestMapping({"/api/auth", "/auth"})
public class AuthController {

	private final AuthService authService;

	@Autowired
	private AuthenticationManager authenticationManager;

	@Autowired
	private JwtUtil jwtUtil;

	@Autowired
	private CustomUserDetailsService customUserDetailsService;

	@Autowired
	private UsuarioRepository usuarioRepository;

	@Autowired
	private ConfiguracionSeguridadService configuracionSeguridadService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
		Optional<Usuario> userOpt = usuarioRepository.findByUsuario(request.getUsuario());
		ConfiguracionSeguridad config = configuracionSeguridadService.obtenerConfiguracion();
		boolean contrasenaExpirada = false;

		if (userOpt.isPresent()) {
			Usuario user = userOpt.get();
			if (user.getBloqueado()) {
				Map<String, String> error = new HashMap<>();
				error.put("error", "La cuenta está bloqueada por demasiados intentos fallidos. Contacte al administrador.");
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
			}
		}

		try {
			System.out.println("Intentando autenticar usuario: " + request.getUsuario());

			authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(request.getUsuario(), request.getContrasena()));

			System.out.println("Autenticación exitosa");


			if (userOpt.isPresent()) {
				Usuario user = userOpt.get();
				user.setIntentosFallidos(0);
				user.setUltimaConexion(LocalDateTime.now());
				usuarioRepository.save(user);


				if (config.getExpiracionDias() > 0 && user.getFechaActualizacionContrasena() != null) {
					long diasPasados = ChronoUnit.DAYS.between(user.getFechaActualizacionContrasena(), LocalDateTime.now());
					if (diasPasados >= config.getExpiracionDias()) {
						contrasenaExpirada = true;
						System.out.println("Contraseña expirada para el usuario: " + request.getUsuario());
					}
				}
			}

		} catch (BadCredentialsException e) {
			System.err.println("Credenciales inválidas para: " + request.getUsuario());
			
			if (userOpt.isPresent()) {
				Usuario user = userOpt.get();
				if (config.getIntentosInvalidos() > 0) {
					user.setIntentosFallidos(user.getIntentosFallidos() + 1);
					int intentosRestantes = config.getIntentosInvalidos() - user.getIntentosFallidos();
					
					if (intentosRestantes <= 0) {
						user.setBloqueado(true);
						usuarioRepository.save(user);
						Map<String, String> error = new HashMap<>();
						error.put("error", "La cuenta ha sido bloqueada tras " + config.getIntentosInvalidos() + " intentos fallidos. Contacte al administrador.");
						return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
					} else {
						usuarioRepository.save(user);
						Map<String, String> error = new HashMap<>();
						String mensaje = "Usuario o contraseña incorrectos. ";
						mensaje += (intentosRestantes == 1) ? "Le queda 1 intento restante." : "Le quedan " + intentosRestantes + " intentos restantes.";
						error.put("error", mensaje);
						return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
					}
				}
			}

			Map<String, String> error = new HashMap<>();
			error.put("error", "Usuario o contraseña incorrectos");
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);

		} catch (Exception e) {
			System.err.println("Error de autenticación: " + e.getMessage());
			e.printStackTrace();
			Map<String, String> error = new HashMap<>();
			error.put("error", "Error de autenticación: " + e.getMessage());
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
		}

		try {

			UserDetails userDetails = customUserDetailsService.loadUserByUsername(request.getUsuario());
			String token = jwtUtil.generateToken(userDetails);

			System.out.println("Token generado exitosamente");
			LoginResponseDTO response = authService.login(request);
			response.setToken(token);
			response.setContrasenaExpirada(contrasenaExpirada);

			System.out.println("Login completado exitosamente para: " + request.getUsuario());

			return ResponseEntity.ok(response);

		} catch (Exception e) {
			System.err.println("Error al generar token o obtener datos: " + e.getMessage());
			e.printStackTrace();
			Map<String, String> error = new HashMap<>();
			error.put("error", "Error al procesar el login: " + e.getMessage());
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
		}
	}

	// Endpoint temporal para encriptar contraseñas (solo desarrollo)
	@Autowired
	private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

	@GetMapping("/encode/{password}")
	public ResponseEntity<?> encode(@PathVariable String password) {
		Map<String, String> response = new HashMap<>();
		response.put("original", password);
		response.put("encoded", passwordEncoder.encode(password));
		return ResponseEntity.ok(response);
	}

	@GetMapping("/test")
	public ResponseEntity<?> test() {
		Map<String, String> response = new HashMap<>();
		response.put("message", "¡JWT funcionando sin roles!");
		response.put("status", "OK");
		return ResponseEntity.ok(response);
	}
}
