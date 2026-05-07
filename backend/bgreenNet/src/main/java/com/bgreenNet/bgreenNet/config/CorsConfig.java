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
        

        config.setAllowCredentials(true); 


        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:4200", // ✅ Dev
            "http://45.183.247.77:8070", // ✅ PreProd
            "http://172.30.72.200", // ✅ QA
            "https://bgreennet.bgreen.com.co", // ✅ Producción frontend
            "https://infos.bgreen.com.co"
            
        ));


        config.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        

        config.setAllowedHeaders(Arrays.asList("*"));
        

        config.setExposedHeaders(Arrays.asList(
            "Authorization", 
            "Content-Type", 
            "X-Auth-Token"
        ));


        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}