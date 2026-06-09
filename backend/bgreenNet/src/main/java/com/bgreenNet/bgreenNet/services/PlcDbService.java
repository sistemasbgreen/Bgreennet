package com.bgreenNet.bgreenNet.services;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class PlcDbService {

    private final JdbcTemplate plcJdbcTemplate;

    public PlcDbService(@Qualifier("plcJdbcTemplate") JdbcTemplate plcJdbcTemplate) {
        this.plcJdbcTemplate = plcJdbcTemplate;
    }

    public List<Map<String, Object>> obtenerVapor() {
        String sql = "SELECT * FROM Tabla_14";
        return plcJdbcTemplate.queryForList(sql);
    }
}
