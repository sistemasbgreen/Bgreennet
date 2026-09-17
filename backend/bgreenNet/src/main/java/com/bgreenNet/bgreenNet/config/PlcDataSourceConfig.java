package com.bgreenNet.bgreenNet.config;

import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class PlcDataSourceConfig {

    /**
     * Pool PLC (DB_Process_Data_PLCs).
     * DataSourceBuilder.create() allows @ConfigurationProperties to correctly bind
     * all plc.datasource.* properties including the plc.datasource.hikari.* sub-properties.
     */
    @Bean(name = "plcDataSource")
    @ConfigurationProperties(prefix = "plc.datasource")
    public HikariDataSource plcDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }

    @Bean(name = "plcJdbcTemplate")
    public JdbcTemplate plcJdbcTemplate(
            @Qualifier("plcDataSource") DataSource plcDataSource) {
        return new JdbcTemplate(plcDataSource);
    }

}
