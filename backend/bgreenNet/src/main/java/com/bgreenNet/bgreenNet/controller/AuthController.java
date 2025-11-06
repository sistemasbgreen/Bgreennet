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
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
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

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

	 private final AuthService authService;
	    
	    @Autowired
	    private AuthenticationManager authenticationManager;
	    
	    @Autowired
	    private JwtUtil jwtUtil;

	    @Autowired
	    private CustomUserDetailsService customUserDetailsService;

	    public AuthController(AuthService authService) {
	        this.authService = authService;
	    }

	    @PostMapping("/login")
	    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
	        try {
	            System.out.println("🔐 Intentando autenticar usuario: " + request.getUsuario());
	            
	            // ✅ Paso 1: Valida credenciales con Spring Security (usa BCrypt)
	            authenticationManager.authenticate(
	                new UsernamePasswordAuthenticationToken(
	                    request.getUsuario(),
	                    request.getContrasena()
	                )
	            );
	            
	            System.out.println("✅ Autenticación exitosa");
	            
	        } catch (BadCredentialsException e) {
	            System.err.println("❌ Credenciales inválidas para: " + request.getUsuario());
	            Map<String, String> error = new HashMap<>();
	            error.put("error", "Usuario o contraseña incorrectos");
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
	            
	        } catch (Exception e) {
	            System.err.println("❌ Error de autenticación: " + e.getMessage());
	            e.printStackTrace();
	            Map<String, String> error = new HashMap<>();
	            error.put("error", "Error de autenticación: " + e.getMessage());
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
	        }

	        try {
	            // ✅ Paso 2: Genera el token JWT
	            UserDetails userDetails = customUserDetailsService.loadUserByUsername(request.getUsuario());
	            String token = jwtUtil.generateToken(userDetails);
	            
	            System.out.println("🎫 Token generado exitosamente");

	            // ✅ Paso 3: Obtiene datos completos del usuario
	            LoginResponseDTO response = authService.login(request);
	            response.setToken(token);
	            
	            System.out.println("✅ Login completado exitosamente para: " + request.getUsuario());
	            
	            return ResponseEntity.ok(response);
	            
	        } catch (Exception e) {
	            System.err.println("❌ Error al generar token o obtener datos: " + e.getMessage());
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
