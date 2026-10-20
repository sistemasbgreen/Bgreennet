package com.bgreenNet.bgreenNet.config;

import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class SiesaAccessDataSourceConfig {

    @Bean(name = "siesaAccessDataSource")
    @ConfigurationProperties(prefix = "siesaaccess.datasource")
    public HikariDataSource siesaAccessDataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setConnectionTestQuery("SELECT 1");
        return ds;
    }

    @Bean(name = "siesaAccessJdbcTemplate")
    public JdbcTemplate siesaAccessJdbcTemplate(
            @Qualifier("siesaAccessDataSource") DataSource siesaAccessDataSource) {
        return new JdbcTemplate(siesaAccessDataSource);
    }
}
