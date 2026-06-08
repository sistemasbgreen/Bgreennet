package com.bgreenNet.bgreenNet.services;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class PlcService {

    private final JdbcTemplate plcJdbcTemplate;

    public PlcService(@Qualifier("plcJdbcTemplate") JdbcTemplate plcJdbcTemplate) {
        this.plcJdbcTemplate = plcJdbcTemplate;
    }

    public Map<String, Float> leerTodas() {
        Map<String, Float> valores = new HashMap<>();

        try {
            // Consulta el último registro de la Tabla_12 ordenada por fecha/timestamp
            String sql = "SELECT TOP 1 * FROM Tabla_12 ORDER BY timestamp DESC";
            Map<String, Object> row = plcJdbcTemplate.queryForMap(sql);

            for (Map.Entry<String, Object> entry : row.entrySet()) {
                String key = entry.getKey();
                Object val = entry.getValue();

                // Evitar el ID y el timestamp del PLC
                if (key.equalsIgnoreCase("id") || key.equalsIgnoreCase("timestamp")) {
                    continue;
                }

                if (val instanceof Number) {
                    valores.put(key, ((Number) val).floatValue());
                }
            }
            System.out.println("✔ Variables leídas de Tabla_12: " + valores.size());

        } catch (Exception e) {
            System.err.println("❌ Error consultando Tabla_14 de la base de datos de PLCs:");
            e.printStackTrace();
        }

        return valores;
    }
}
