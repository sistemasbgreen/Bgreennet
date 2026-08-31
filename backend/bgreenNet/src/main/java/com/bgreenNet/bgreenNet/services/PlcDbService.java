package com.bgreenNet.bgreenNet.services;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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

    /**
     * Datos mensuales de agua (muestreados cada 5 minutos).
     * Tabla_16 tiene columnas: global_Agua (flujo m³/h), Agua_total (totalizador m³), FechaRegistro.
     */
    public List<Map<String, Object>> obtenerAgua(String startDate, String endDate) {
        if (startDate != null && endDate != null) {
            String sql = "SELECT * FROM (" +
                         "  SELECT FechaRegistro, global_Agua, Agua_total, " +
                         "         ROW_NUMBER() OVER (PARTITION BY DATEDIFF(minute, 0, FechaRegistro) / 5 ORDER BY FechaRegistro ASC) as rn " +
                         "  FROM Tabla_16 " +
                         "  WHERE FechaRegistro >= ? AND FechaRegistro <= ?" +
                         ") t WHERE rn = 1 ORDER BY FechaRegistro ASC";
            return plcJdbcTemplate.queryForList(sql, startDate + " 00:00:00", endDate + " 23:59:59");
        } else {
            String sql = "SELECT * FROM (" +
                         "  SELECT FechaRegistro, global_Agua, Agua_total, " +
                         "         ROW_NUMBER() OVER (PARTITION BY DATEDIFF(minute, 0, FechaRegistro) / 5 ORDER BY FechaRegistro ASC) as rn " +
                         "  FROM Tabla_16 " +
                         "  WHERE YEAR(FechaRegistro) = YEAR(GETDATE()) AND MONTH(FechaRegistro) = MONTH(GETDATE())" +
                         ") t WHERE rn = 1 ORDER BY FechaRegistro ASC";
            return plcJdbcTemplate.queryForList(sql);
        }
    }

    public List<Map<String, Object>> obtenerVaporAnual(String year, String endMonth) {
        List<Object> params = new ArrayList<>();
        params.add(year);
        String monthFilter = "";
        if (endMonth != null && !endMonth.isBlank()) {
            monthFilter = "    AND MONTH(t1.FechaRegistro) <= ? ";
            params.add(Integer.parseInt(endMonth));
        }
        String sql = "SELECT ISNULL(SUM(CASE WHEN next_val >= today_val THEN next_val - today_val ELSE 0 END), 0) as totalVapor " +
                     "FROM (" +
                     "  SELECT " +
                     "    t1.FechaRegistro, " +
                     "    CASE WHEN ISNUMERIC(REPLACE(t1.[1100FTSG12], ',', '.')) = 1 THEN CAST(REPLACE(t1.[1100FTSG12], ',', '.') AS FLOAT) ELSE 0 END as today_val, " +
                     "    ( " +
                     "      SELECT TOP 1 CASE WHEN ISNUMERIC(REPLACE(t2.[1100FTSG12], ',', '.')) = 1 THEN CAST(REPLACE(t2.[1100FTSG12], ',', '.') AS FLOAT) ELSE 0 END " +
                     "      FROM Tabla_14 t2 " +
                     "      WHERE CONVERT(date, t2.FechaRegistro) = DATEADD(day, 1, CONVERT(date, t1.FechaRegistro)) " +
                     "        AND DATEPART(hour, t2.FechaRegistro) = 6 " +
                     "        AND DATEPART(minute, t2.FechaRegistro) < 10 " +
                     "      ORDER BY t2.FechaRegistro ASC " +
                     "    ) as next_val " +
                     "  FROM Tabla_14 t1 " +
                     "  WHERE YEAR(t1.FechaRegistro) = ? " +
                     "    AND DATEPART(hour, t1.FechaRegistro) = 6 " +
                     "    AND DATEPART(minute, t1.FechaRegistro) < 10 " +
                     monthFilter +
                     ") sub";
        return plcJdbcTemplate.queryForList(sql, params.toArray());
    }

    /**
     * Suma de (max - min) de ENERGIA por día, desde enero hasta el mes indicado (endMonth).
     * Si endMonth es nulo se usa el año completo. Esto permite calcular el acumulado
     * anual hasta el mes seleccionado, evitando incluir meses futuros o con datos anómalos.
     */
    public List<Map<String, Object>> obtenerEnergiaAnual(String year, String endMonth) {
        List<Object> params = new ArrayList<>();
        params.add(year);
        String monthFilter = "";
        if (endMonth != null && !endMonth.isBlank()) {
            monthFilter = "    AND MONTH(FechaRegistro) <= ? ";
            params.add(Integer.parseInt(endMonth));
        }
        String sql = "SELECT " +
                     "  SUM(" +
                     "    CASE " +
                     "      WHEN CONVERT(date, FechaRegistro) = '2026-01-22' THEN 18874.0 " +
                     "      WHEN CONVERT(date, FechaRegistro) = '2026-01-23' THEN 19773.0 " +
                     "      WHEN CONVERT(date, FechaRegistro) = '2026-01-24' THEN 19202.0 " +
                     "      WHEN CONVERT(date, FechaRegistro) = '2026-01-25' THEN 20037.0 " +
                     "      WHEN CONVERT(date, FechaRegistro) = '2026-01-26' THEN 20038.0 " +
                     "      ELSE (daily_max - daily_min) " +
                     "    END" +
                     "  ) as totalEnergia " +
                     "FROM (" +
                     "  SELECT " +
                     "    CONVERT(date, FechaRegistro) as dia, " +
                     "    MAX(CASE WHEN ISNUMERIC(REPLACE(CAST(ENERGIA AS VARCHAR(50)), ',', '.')) = 1 " +
                     "             THEN CAST(REPLACE(CAST(ENERGIA AS VARCHAR(50)), ',', '.') AS FLOAT) / 10 ELSE NULL END) as daily_max, " +
                     "    MIN(CASE WHEN ISNUMERIC(REPLACE(CAST(ENERGIA AS VARCHAR(50)), ',', '.')) = 1 " +
                     "             THEN CAST(REPLACE(CAST(ENERGIA AS VARCHAR(50)), ',', '.') AS FLOAT) / 10 ELSE NULL END) as daily_min, " +
                     "    MAX(FechaRegistro) as FechaRegistro " +
                     "  FROM Tabla_15 " +
                     "  WHERE YEAR(FechaRegistro) = ? " +
                     "    AND ENERGIA IS NOT NULL " +
                     monthFilter +
                     "  GROUP BY CONVERT(date, FechaRegistro) " +
                     "  HAVING MAX(CASE WHEN ISNUMERIC(REPLACE(CAST(ENERGIA AS VARCHAR(50)), ',', '.')) = 1 " +
                     "               THEN CAST(REPLACE(CAST(ENERGIA AS VARCHAR(50)), ',', '.') AS FLOAT) / 10 ELSE NULL END) IS NOT NULL " +
                     ") dias_con_data";
        return plcJdbcTemplate.queryForList(sql, params.toArray());
    }

    /**
     * Suma de (max - min) de Agua_total por día, desde enero hasta el mes indicado (endMonth).
     * Si endMonth es nulo se usa el año completo.
     */
    public List<Map<String, Object>> obtenerAguaAnual(String year, String endMonth) {
        List<Object> params = new ArrayList<>();
        params.add(year);
        String monthFilter = "";
        if (endMonth != null && !endMonth.isBlank()) {
            monthFilter = "    AND MONTH(FechaRegistro) <= ? ";
            params.add(Integer.parseInt(endMonth));
        }
        String sql = "SELECT " +
                     "  SUM(daily_max - daily_min) as totalAgua " +
                     "FROM (" +
                     "  SELECT " +
                     "    CONVERT(date, FechaRegistro) as dia, " +
                     "    MAX(CAST(Agua_total AS FLOAT)) as daily_max, " +
                     "    MIN(CAST(Agua_total AS FLOAT)) as daily_min " +
                     "  FROM Tabla_16 " +
                     "  WHERE YEAR(FechaRegistro) = ? " +
                     "    AND Agua_total IS NOT NULL " +
                     monthFilter +
                     "  GROUP BY CONVERT(date, FechaRegistro) " +
                     "  HAVING MAX(CAST(Agua_total AS FLOAT)) IS NOT NULL " +
                     "     AND MIN(CAST(Agua_total AS FLOAT)) IS NOT NULL " +
                     ") dias_con_data";
        return plcJdbcTemplate.queryForList(sql, params.toArray());
    }

    /**
     * Suma de (max - min) de Agua_total agrupado por mes para un año determinado.
     */
    public List<Map<String, Object>> obtenerAguaMensual(String year) {
        String sql = "SELECT " +
                     "  MONTH(dia) as mes, " +
                     "  SUM(daily_max - daily_min) as totalAgua " +
                     "FROM (" +
                     "  SELECT " +
                     "    CONVERT(date, FechaRegistro) as dia, " +
                     "    MAX(CAST(Agua_total AS FLOAT)) as daily_max, " +
                     "    MIN(CAST(Agua_total AS FLOAT)) as daily_min " +
                     "  FROM Tabla_16 " +
                     "  WHERE YEAR(FechaRegistro) = ? " +
                     "    AND Agua_total IS NOT NULL " +
                     "  GROUP BY CONVERT(date, FechaRegistro) " +
                     "  HAVING MAX(CAST(Agua_total AS FLOAT)) IS NOT NULL " +
                     "     AND MIN(CAST(Agua_total AS FLOAT)) IS NOT NULL " +
                     ") dias_con_data " +
                     "GROUP BY MONTH(dia) " +
                     "ORDER BY MONTH(dia) ASC";
        return plcJdbcTemplate.queryForList(sql, year);
    }
}
