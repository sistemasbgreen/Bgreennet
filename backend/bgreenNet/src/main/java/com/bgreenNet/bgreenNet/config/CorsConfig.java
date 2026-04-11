package com.bgreenNet.bgreenNet.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // ✅ Permitir credenciales si el frontend envía tokens/cookies
        config.setAllowCredentials(true); 

        // ✅ URLs SIN espacios al final y solo las necesarias
        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:4200",              // Desarrollo local Angular
            "http://172.30.72.200",
            "https://bgreennet.bgreen.com.co",    // ✅ Producción frontend (SIN espacios)
            "https://infos.bgreen.com.co"         // Si también la usas
            // Elimina las URLs HTTP antiguas que ya no usas,
            
        ));

        // ✅ Métodos permitidos
        config.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        
        // ✅ Headers permitidos
        config.setAllowedHeaders(Arrays.asList("*"));
        
        // ✅ Headers expuestos (para que el frontend pueda leer respuestas)
        config.setExposedHeaders(Arrays.asList(
            "Authorization", 
            "Content-Type", 
            "X-Auth-Token"
        ));

        // ✅ Máxima edad del preflight cache (en segundos)
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}