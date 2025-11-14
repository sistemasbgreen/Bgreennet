
package com.bgreenNet.bgreenNet;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;

import javax.sql.DataSource;

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
	    CommandLineRunner testJdbc(JdbcTemplate jdbcTemplate, DataSource dataSource) {
	        return args -> {
	            System.out.println("Probando conexión con la base de datos...");

	            try {
	           
	                Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
	                System.out.println("Conexión establecida correctamente, resultado: " + result);

	     
	                try (Connection connection = dataSource.getConnection()) {
	                    DatabaseMetaData metaData = connection.getMetaData();

	                    String dbName = metaData.getDatabaseProductName();       
	                    String dbVersion = metaData.getDatabaseProductVersion();  
	                    String url = metaData.getURL(); 
	                    String userName = metaData.getUserName();

	                    String actualDatabaseName = jdbcTemplate.queryForObject(
	                        "SELECT DB_NAME()", String.class
	                    );

	                    System.out.println("=== Información de la conexión ===");
	                    System.out.println("Producto de base de datos: " + dbName);
	                    System.out.println("Versión: " + dbVersion);
	                    System.out.println("Usuario: " + userName);
	                    System.out.println("Base de datos actual: " + actualDatabaseName);
	                    System.out.println("URL de conexión: " + url);
	                }

	            } catch (SQLException e) {
	                System.err.println("Error al obtener metadatos de la base de datos: " + e.getMessage());
	            } catch (Exception e) {
	                System.err.println("Error general: " + e.getMessage());
	            }
	        };
	    }

}
