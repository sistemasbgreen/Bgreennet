package com.bgreenNet.bgreenNet.jwt;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.bgreenNet.bgreenNet.services.CustomUserDetailsService;

import io.jsonwebtoken.io.IOException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

	 @Autowired
	    private JwtUtil jwtUtil;

	    @Autowired
	    private CustomUserDetailsService customUserDetailsService; // Debe coincidir con el paquete arriba

	    @Override
	    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
	            throws ServletException, IOException {

	        final String authorizationHeader = request.getHeader("Authorization");
	        String username = null;
	        String jwt = null;

	        // 🔍 Depuración: Verifica si llega el header
	        if (authorizationHeader != null) {
	            System.out.println("🔍 Header Authorization recibido: " + authorizationHeader);
	        } else {
	            System.out.println("⚠️  No se recibió header Authorization");
	        }

	        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
	            jwt = authorizationHeader.substring(7);
	            try {
	                username = jwtUtil.extractUsername(jwt);
	                System.out.println("✅ Usuario extraído del token: " + username);
	            } catch (Exception e) {
	                System.out.println("❌ Error al extraer usuario del token: " + e.getMessage());
	            }
	        }

	        // 🔑 Intenta autenticar si hay usuario y no hay autenticación previa
	        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
	            try {
	                System.out.println("🔍 Cargando detalles del usuario: " + username);
	                UserDetails userDetails = this.customUserDetailsService.loadUserByUsername(username);
	                System.out.println("✅ Usuario encontrado en BD: " + userDetails.getUsername());
	                System.out.println("🔑 Authorities: " + userDetails.getAuthorities());

	                if (jwtUtil.validateToken(jwt, userDetails)) {
	                    System.out.println("✅ Token válido. Autenticando usuario...");
	                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
	                        userDetails, null, userDetails.getAuthorities()
	                    );
	                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
	                    SecurityContextHolder.getContext().setAuthentication(authToken);
	                    System.out.println("✅ Usuario autenticado correctamente");
	                } else {
	                    System.out.println("❌ Token inválido o expirado");
	                }
	            } catch (Exception e) {
	                System.out.println("🚨 Error al cargar usuario: " + e.getMessage());
	                e.printStackTrace();
	            }
	        } else if (username == null) {
	            System.out.println("⚠️  No se pudo extraer usuario del token");
	        } else {
	            System.out.println("ℹ️  Ya existe una autenticación activa");
	        }

	        try {
				chain.doFilter(request, response);
			} catch (java.io.IOException e) {
			
				e.printStackTrace();
			} catch (ServletException e) {
			
				e.printStackTrace();
			}
	    }

}
