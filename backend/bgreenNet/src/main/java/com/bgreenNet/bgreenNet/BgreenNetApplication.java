package com.bgreenNet.bgreenNet;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class BgreenNetApplication {

	public static void main(String[] args) {
		SpringApplication.run(BgreenNetApplication.class, args);
	}
	
	@Bean
	CommandLineRunner testJdbc(JdbcTemplate jdbcTemplate) {
	    return args -> {
	        System.out.println("Probando conexión con la base de datos...");
	        try {
	            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
	            System.out.println("Conexión establecida correctamente, resultado: " + result);
	        } catch (Exception e) {
	            System.err.println("Error al conectar con la base de datos: " + e.getMessage());
	        }
	    };
	}
	
	

}
