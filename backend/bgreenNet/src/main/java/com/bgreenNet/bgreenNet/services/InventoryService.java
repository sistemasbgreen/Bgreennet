package com.bgreenNet.bgreenNet.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.dto.DailyRecord;
import com.bgreenNet.bgreenNet.dto.ReportResponse;

@Service
public class InventoryService {

    private final JdbcTemplate siesaJdbcTemplate;

    public InventoryService(
            @Qualifier("siesaJdbcTemplate") JdbcTemplate siesaJdbcTemplate) {
        this.siesaJdbcTemplate = siesaJdbcTemplate;
    }

    public ReportResponse generateReport(
            String startDate,
            String endDate,
            String consumptionProductId,
            String productionProductId) {

        // 🔍 CONFIRMACIÓN DE BD (déjalo mientras pruebas)
        String db = siesaJdbcTemplate.queryForObject("SELECT DB_NAME()", String.class);
        System.out.println(">>> BD USADA POR SPRING (SIESA): " + db);

        // 1️⃣ CONSUMO
        String sqlConsumo = """
            SELECT
                CONVERT(VARCHAR, mov.f470_id_fecha, 23) AS fecha_documento,
                SUM(
                    CASE WHEN f470_ind_naturaleza = 2 THEN f470_cant_base ELSE 0 END -
                    CASE WHEN f470_ind_naturaleza = 1 THEN f470_cant_base ELSE 0 END
                ) AS cantidad_consumida
            FROM [t124_mc_items_referencias]
            LEFT JOIN [t120_mc_items] item ON f120_rowid = f124_rowid_item
            INNER JOIN [t121_mc_items_extensiones] ON f121_rowid_item = f120_rowid
            INNER JOIN [t470_cm_movto_invent] mov ON mov.f470_rowid_item_ext = f121_rowid
            INNER JOIN [t350_co_docto_contable] doc ON doc.f350_rowid = mov.f470_rowid_docto
            INNER JOIN [t150_mc_bodegas] bod ON bod.f150_rowid = mov.f470_rowid_bodega
            WHERE mov.f470_id_fecha BETWEEN ? AND ?
              AND f120_id_cia = 2
              AND f350_ind_estado = 1
              AND f120_id = ?
              AND f350_id_tipo_docto IN ('TEP','EI')
            GROUP BY mov.f470_id_fecha
            ORDER BY mov.f470_id_fecha
        """;

        Map<String, Double> consumoMap = new HashMap<>();
        double[] totalConsumption = {0.0};

        siesaJdbcTemplate.query(sqlConsumo, rs -> {
            String date = rs.getString("fecha_documento");
            double qty = rs.getDouble("cantidad_consumida");
            consumoMap.put(date, qty);
            totalConsumption[0] += qty;
        }, startDate, endDate, consumptionProductId);

        // 2️⃣ PRODUCCIÓN
        String sqlProduccion = """
            SELECT
                CONVERT(VARCHAR, mov.f470_id_fecha, 23) AS fecha_documento,
                ABS(SUM(
                    CASE WHEN f470_ind_naturaleza = 1 THEN f470_cant_base ELSE 0 END -
                    CASE WHEN f470_ind_naturaleza = 2 THEN f470_cant_base ELSE 0 END
                )) AS total_produccion
            FROM [t124_mc_items_referencias]
            LEFT JOIN [t120_mc_items] item ON f120_rowid = f124_rowid_item
            INNER JOIN [t121_mc_items_extensiones] ON f121_rowid_item = f120_rowid
            INNER JOIN [t470_cm_movto_invent] mov ON mov.f470_rowid_item_ext = f121_rowid
            INNER JOIN [t350_co_docto_contable] doc ON doc.f350_rowid = mov.f470_rowid_docto
            INNER JOIN [t150_mc_bodegas] bod ON bod.f150_rowid = mov.f470_rowid_bodega
            WHERE mov.f470_id_fecha BETWEEN ? AND ?
              AND f120_id_cia = 2
              AND f350_ind_estado = 1
              AND f120_id = ?
              AND f350_id_tipo_docto IN ('EDP','EI','AI')
            GROUP BY mov.f470_id_fecha
            ORDER BY mov.f470_id_fecha
        """;

        Map<String, Double> produccionMap = new HashMap<>();
        double[] totalProduction = {0.0};

        siesaJdbcTemplate.query(sqlProduccion, rs -> {
            String date = rs.getString("fecha_documento");
            double qty = Math.max(rs.getDouble("total_produccion"), 0.001);
            produccionMap.put(date, qty);
            totalProduction[0] += qty;
        }, startDate, endDate, productionProductId);

        // 3️⃣ CÁLCULO DIARIO
        List<DailyRecord> dailyData = new ArrayList<>();

        for (String date : consumoMap.keySet()) {
            if (produccionMap.containsKey(date)) {
                double cons = consumoMap.get(date);
                double prod = produccionMap.get(date);
                int ratio = (int) Math.round((cons / prod) * 1000);

                DailyRecord rec = new DailyRecord();
                rec.setDate(date);
                rec.setConsumo(cons);
                rec.setProduccion(prod);
                rec.setConsumo_diario(ratio);
                dailyData.add(rec);
            }
        }

        // 4️⃣ ACUMULADO
        int monthlyAccumulated = (int) Math.round(
            (totalProduction[0] > 0)
                ? (totalConsumption[0] / totalProduction[0]) * 1000
                : 0
        );

        ReportResponse resp = new ReportResponse();
        resp.setDailyData(dailyData);
        resp.setMonthlyAccumulated(monthlyAccumulated);
        resp.setTotalConsumption(totalConsumption[0]);
        resp.setTotalProduction(totalProduction[0]);
        resp.setValidDays(dailyData.size());

        return resp;
    }
}
