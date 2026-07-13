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

    public List<Map<String, Object>> obtenerVapor(String startDate, String endDate) {
        if (startDate != null && endDate != null) {
            String sql = "SELECT * FROM (" +
                         "  SELECT FechaRegistro, [1100FTSG11], [550FT04], [1100FTSG12], " +
                         "         ROW_NUMBER() OVER (PARTITION BY DATEDIFF(minute, 0, FechaRegistro) / 5 ORDER BY FechaRegistro ASC) as rn " +
                         "  FROM Tabla_14 " +
                         "  WHERE FechaRegistro >= ? AND FechaRegistro <= ?" +
                         ") t WHERE rn = 1 ORDER BY FechaRegistro ASC";
            return plcJdbcTemplate.queryForList(sql, startDate + " 00:00:00", endDate + " 23:59:59");
        } else {
            String sql = "SELECT * FROM (" +
                         "  SELECT FechaRegistro, [1100FTSG11], [550FT04], [1100FTSG12], " +
                         "         ROW_NUMBER() OVER (PARTITION BY DATEDIFF(minute, 0, FechaRegistro) / 5 ORDER BY FechaRegistro ASC) as rn " +
                         "  FROM Tabla_14 " +
                         "  WHERE YEAR(FechaRegistro) = YEAR(GETDATE()) AND MONTH(FechaRegistro) = MONTH(GETDATE())" +
                         ") t WHERE rn = 1 ORDER BY FechaRegistro ASC";
            return plcJdbcTemplate.queryForList(sql);
        }
    }

    public List<Map<String, Object>> obtenerEnergia(String startDate, String endDate) {
        if (startDate != null && endDate != null) {
            String sql = "SELECT * FROM (" +
                         "  SELECT FechaRegistro, ENERGIA, FT520129, CONTADOR_U520, CONTADOR_CCM1, CONTADOR_CCM2, CONTADOR_CCM3, CONTADOR_ADMON, POTENCIA_GEN, " +
                         "         ROW_NUMBER() OVER (PARTITION BY DATEDIFF(minute, 0, FechaRegistro) / 5 ORDER BY FechaRegistro ASC) as rn " +
                         "  FROM Tabla_15 " +
                         "  WHERE FechaRegistro >= ? AND FechaRegistro <= ?" +
                         ") t WHERE rn = 1 ORDER BY FechaRegistro ASC";
            return plcJdbcTemplate.queryForList(sql, startDate + " 00:00:00", endDate + " 23:59:59");
        } else {
            String sql = "SELECT * FROM (" +
                         "  SELECT FechaRegistro, ENERGIA, FT520129, CONTADOR_U520, CONTADOR_CCM1, CONTADOR_CCM2, CONTADOR_CCM3, CONTADOR_ADMON, POTENCIA_GEN, " +
                         "         ROW_NUMBER() OVER (PARTITION BY DATEDIFF(minute, 0, FechaRegistro) / 5 ORDER BY FechaRegistro ASC) as rn " +
                         "  FROM Tabla_15 " +
                         "  WHERE YEAR(FechaRegistro) = YEAR(GETDATE()) AND MONTH(FechaRegistro) = MONTH(GETDATE())" +
                         ") t WHERE rn = 1 ORDER BY FechaRegistro ASC";
            return plcJdbcTemplate.queryForList(sql);
        }
    }

    public List<Map<String, Object>> obtenerVaporAnual(String year) {
        String sql = "SELECT SUM(CASE WHEN ISNUMERIC(REPLACE([1100FTSG12], ',', '.')) = 1 THEN CAST(REPLACE([1100FTSG12], ',', '.') AS FLOAT) ELSE 0 END) as totalVapor FROM Tabla_14 WHERE YEAR(FechaRegistro) = ?";
        return plcJdbcTemplate.queryForList(sql, year);
    }

    public List<Map<String, Object>> obtenerEnergiaAnual(String year) {
        // Calcula la suma de diferencias (max-min) por día directamente en SQL
        // Evita descargar todas las filas del año a la JVM
        String sql = "SELECT " +
                     "  SUM(daily_max - daily_min) as totalEnergia " +
                     "FROM (" +
                     "  SELECT " +
                     "    CONVERT(date, FechaRegistro) as dia, " +
                     "    MAX(CASE WHEN ISNUMERIC(REPLACE(CAST(ENERGIA AS VARCHAR(50)), ',', '.')) = 1 " +
                     "             THEN CAST(REPLACE(CAST(ENERGIA AS VARCHAR(50)), ',', '.') AS FLOAT) / 10 ELSE NULL END) as daily_max, " +
                     "    MIN(CASE WHEN ISNUMERIC(REPLACE(CAST(ENERGIA AS VARCHAR(50)), ',', '.')) = 1 " +
                     "             THEN CAST(REPLACE(CAST(ENERGIA AS VARCHAR(50)), ',', '.') AS FLOAT) / 10 ELSE NULL END) as daily_min " +
                     "  FROM Tabla_15 " +
                     "  WHERE YEAR(FechaRegistro) = ? " +
                     "    AND ENERGIA IS NOT NULL " +
                     "  GROUP BY CONVERT(date, FechaRegistro) " +
                     "  HAVING MAX(CASE WHEN ISNUMERIC(REPLACE(CAST(ENERGIA AS VARCHAR(50)), ',', '.')) = 1 " +
                     "               THEN CAST(REPLACE(CAST(ENERGIA AS VARCHAR(50)), ',', '.') AS FLOAT) / 10 ELSE NULL END) IS NOT NULL " +
                     ") dias_con_data";
        return plcJdbcTemplate.queryForList(sql, year);
    }
}
