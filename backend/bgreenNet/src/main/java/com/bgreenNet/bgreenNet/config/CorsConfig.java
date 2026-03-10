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
	    		"http://localhost:4200",
	            "https://infos.bgreen.com.co",
	            "http://45.183.247.77:8090",
	            "http://45.183.247.77:8080",
	            "http://172.30.72.200",
	            "https://bgreennet.bgreen.com.co",
	            "http://bgreennet.bgreennet.com:8080"
	    ));

	    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
	    config.setAllowedHeaders(Arrays.asList("*"));

	    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
	    source.registerCorsConfiguration("/**", config);
	    return source;
	}
	}
