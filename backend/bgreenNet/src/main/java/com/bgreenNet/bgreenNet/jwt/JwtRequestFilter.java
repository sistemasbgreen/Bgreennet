package com.bgreenNet.bgreenNet.jwt;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.bgreenNet.bgreenNet.services.CustomUserDetailsService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.List;
import io.jsonwebtoken.ExpiredJwtException;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    // Rutas públicas: las que terminan con "/" se tratan como prefijos,
    // las demás se tratan como rutas exactas.
    private static final List<String> EXCLUDED_PATHS = Arrays.asList(
        "/api/auth/",
        "/auth/",
        "/api/auth/login",
        "/auth/login",
        "/api/auth/test",
        "/auth/test",
        "/api/listas/",
        "/listas/",
        "/api/home/contacto",
        "/home/contacto",
        "/api/usuarios/",
        "/usuarios/",
        "/api/sistemasinformacion/",
        "/sistemasinformacion/"
    );

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();

        for (String excluded : EXCLUDED_PATHS) {
            if (excluded.endsWith("/")) {
                if (path.startsWith(excluded)) {
                    return true;
                }
            } else {
                if (path.equals(excluded)) {
                    return true;
                }
            }
        }
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, java.io.IOException {
        
        final String authorizationHeader = request.getHeader("Authorization");
        String username = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (ExpiredJwtException e) {
                System.out.println("⚠️ El token JWT ha expirado: " + e.getMessage());
            } catch (Exception e) {
                System.out.println("❌ Error al procesar el token JWT: " + e.getMessage());
            }
        }

        // Si ya hay un usuario autenticado, no hacer nada
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

                if (jwtUtil.validateToken(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()
                        );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (Exception e) {
                System.out.println("❌ Error al cargar el usuario o validar el token: " + e.getMessage());
            }
        }

        chain.doFilter(request, response);
    }
}