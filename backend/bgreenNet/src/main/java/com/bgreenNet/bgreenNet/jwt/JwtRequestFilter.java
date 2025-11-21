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
	    private CustomUserDetailsService customUserDetailsService;
	    
	    private static final String[] EXCLUDED_PATHS = {
	            "/api/auth/login",
	            "/api/auth/register",
	            "/api/home/contacto",
	          //  "/api/usuarios/crear"
	        };
	    
	    @Override
	    protected boolean shouldNotFilter(HttpServletRequest request) {
	        String path = request.getRequestURI();

	        for (String excluded : EXCLUDED_PATHS) {
	            if (path.equals(excluded)) {
	                return true;  // No aplicar el filtro en esta ruta
	            }
	        }

	        return false; // Aplicar filtro al resto
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
	            } catch (Exception e) {
	                System.out.println("❌ Error token: " + e.getMessage());
	            }
	        }

	        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
	            UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

	            if (jwtUtil.validateToken(jwt, userDetails)) {
	                UsernamePasswordAuthenticationToken authToken =
	                        new UsernamePasswordAuthenticationToken(
	                                userDetails, null, userDetails.getAuthorities()
	                        );
	                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
	                SecurityContextHolder.getContext().setAuthentication(authToken);
	            }
	        }

	        chain.doFilter(request, response);
	    }




	   

}

