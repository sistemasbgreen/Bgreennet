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
	    config.setAllowCredentials(false); //

	
	    config.setAllowedOrigins(Arrays.asList(
	    		"http://localhost:4200",          // Angular dev
	            "https://infos.bgreen.com.co",    // Producción dominio
	            "https://45.183.247.77:8090",          // Angular por IP (HTTPS)
	            "http://172.30.72.200",            // Red interna
	            "https://bgreennet.bgreen.com.co"
	    ));

	    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
	    config.setAllowedHeaders(Arrays.asList("*"));

	    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
	    source.registerCorsConfiguration("/**", config);
	    return source;
	}
	

}
