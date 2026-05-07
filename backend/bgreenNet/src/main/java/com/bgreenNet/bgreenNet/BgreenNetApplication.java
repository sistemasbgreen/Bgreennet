package com.bgreenNet.bgreenNet;

import java.sql.Connection;
import java.sql.DatabaseMetaData;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.bgreenNet.bgreenNet.services.EmailReporteService;

import jakarta.annotation.PostConstruct;

@SpringBootApplication
@EnableScheduling
public class BgreenNetApplication {

    public static void main(String[] args) {
        SpringApplication.run(BgreenNetApplication.class, args);
    }
    
    @Autowired
    private EmailReporteService emailReporteService;
    


    @Bean
    CommandLineRunner testJdbcConnections(
            @Qualifier("primaryJdbcTemplate") JdbcTemplate primaryJdbcTemplate,
            @Qualifier("primaryDataSource") DataSource primaryDataSource,
            @Qualifier("siesaJdbcTemplate") JdbcTemplate siesaJdbcTemplate,
            @Qualifier("siesaDataSource") DataSource siesaDataSource
    ) {
        return args -> {
            probarConexion("BASE DE DATOS PRINCIPAL", primaryJdbcTemplate, primaryDataSource);
            probarConexion("BASE DE DATOS SIESA", siesaJdbcTemplate, siesaDataSource);
        };
    }

    private void probarConexion(
            String nombreConexion,
            JdbcTemplate jdbcTemplate,
            DataSource dataSource
    ) {

        System.out.println("\n==============================");
        System.out.println("Probando conexión: " + nombreConexion);
        System.out.println("==============================");

        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            System.out.println("✅ Conexión OK (SELECT 1 = " + result + ")");

            try (Connection connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();
                System.out.println("Usuario     : " + metaData.getUserName());

                String actualDatabaseName =
                        jdbcTemplate.queryForObject("SELECT DB_NAME()", String.class);

                System.out.println("Base actual : " + actualDatabaseName);
            }

        } catch (Exception e) {
            System.err.println("❌ ERROR en " + nombreConexion);
            System.err.println("Motivo: " + e.getMessage());
        }
    }
}
