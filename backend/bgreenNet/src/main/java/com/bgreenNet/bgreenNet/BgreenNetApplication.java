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
            @Qualifier("siesaDataSource") DataSource siesaDataSource,
            @Qualifier("plcJdbcTemplate") JdbcTemplate plcJdbcTemplate,
            @Qualifier("plcDataSource") DataSource plcDataSource
    ) {
        return args -> {
            boolean conn1 = probarConexion("BASE DE DATOS PRINCIPAL", primaryJdbcTemplate, primaryDataSource);
            boolean conn2 = probarConexion("BASE DE DATOS SIESA", siesaJdbcTemplate, siesaDataSource);
            boolean conn3 = probarConexion("BASE DE DATOS PLC", plcJdbcTemplate, plcDataSource);

            System.out.println("\n========================================");
            System.out.println("    RESUMEN DE CONEXIONES A BASE DE DATOS");
            System.out.println("========================================");
            System.out.println(" CONEXIÓN 1 (Principal) : " + (conn1 ? "✅ CONECTADO" : "❌ FALLÓ"));
            System.out.println(" CONEXIÓN 2 (SIESA)     : " + (conn2 ? "✅ CONECTADO" : "❌ FALLÓ"));
            System.out.println(" CONEXIÓN 3 (PLC)       : " + (conn3 ? "✅ CONECTADO" : "❌ FALLÓ"));
            System.out.println("========================================\n");
        };
    }

    private boolean probarConexion(
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
            return true;

        } catch (Exception e) {
            System.err.println("❌ ERROR en " + nombreConexion);
            System.err.println("Motivo: " + e.getMessage());
            return false;
        }
    }
}
