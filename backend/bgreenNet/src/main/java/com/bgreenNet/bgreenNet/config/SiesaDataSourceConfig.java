package com.bgreenNet.bgreenNet.config;

import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class SiesaDataSourceConfig {

    @Bean(name = "siesaDataSource")
    @ConfigurationProperties(prefix = "siesa.datasource")
    public HikariDataSource siesaDataSource() {
        return new HikariDataSource();
    }

    @Bean(name = "siesaJdbcTemplate")
    public JdbcTemplate siesaJdbcTemplate(
            @Qualifier("siesaDataSource") DataSource siesaDataSource) {
        return new JdbcTemplate(siesaDataSource);
    }
}
