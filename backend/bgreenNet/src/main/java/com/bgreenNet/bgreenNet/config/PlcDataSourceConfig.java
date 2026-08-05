package com.bgreenNet.bgreenNet.config;

import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class PlcDataSourceConfig {

    @Bean(name = "plcDataSource")
    @ConfigurationProperties(prefix = "plc.datasource")
    public HikariDataSource plcDataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setConnectionTestQuery("SELECT 1");
        return ds;
    }

    @Bean(name = "plcJdbcTemplate")
    public JdbcTemplate plcJdbcTemplate(
            @Qualifier("plcDataSource") DataSource plcDataSource) {
        return new JdbcTemplate(plcDataSource);
    }
    


}
