package com.bgreenNet.bgreenNet.config;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import com.bgreenNet.bgreenNet.jwt.JwtUtil;

public class TokenGenerator implements CommandLineRunner {
	
	 @Autowired
	    private JwtUtil jwtUtil;

	    @Override
	    public void run(String... args) throws Exception {
	        // Simula un usuario autenticado
	        String username = "jangulo"; // ← Usa un nombre de usuario que exista en tu BD
	        
	        // Simula roles (debe coincidir con tu lógica de CustomUserDetailsService)
	        var authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR"));
	        
	        UserDetails userDetails = new User(username, "", authorities);

	        // Genera el token
	        String token = jwtUtil.generateToken(userDetails);

	        // Muestra el token en la consola
	        System.out.println("==================================================");
	        System.out.println("🔐 TOKEN JWT GENERADO PARA PRUEBAS:");
	        System.out.println(token);
	        System.out.println("==================================================");
	        System.out.println("Usa este token en Postman con:");
	        System.out.println("Header: Authorization = Bearer " + token);
	        System.out.println("==================================================");
	    }

}
