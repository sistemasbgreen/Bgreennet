package com.bgreenNet.bgreenNet.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.dto.CmiplantaDTO;
import com.bgreenNet.bgreenNet.dto.CmiplantaResponseDTO;


@Service
public class cmiplantaServices {
	
	
    private final JdbcTemplate siesaJdbcTemplate;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    public cmiplantaServices(@Qualifier("siesaJdbcTemplate") JdbcTemplate siesaJdbcTemplate) {
        this.siesaJdbcTemplate = siesaJdbcTemplate;
    }
    
    public CmiplantaResponseDTO generateReport(
            String startDate,
            String endDate,
            String consumptionProductId,
            String productionProductId,
            List<String> consumptionDocTypes,
            List<String> productionDocTypes) {

        // ========================================
        // CASO ESPECIAL: B100 (Producto 26)
        // ========================================
        boolean isB100 = "26".equals(productionProductId) && "26".equals(consumptionProductId);
        
        if (isB100) {
            return generateB100Report(startDate, endDate);
        }

        // ========================================
        // LOGICA NORMAL PARA OTROS PRODUCTOS
        // ========================================
        
        // Validar tipos de documento
        validateDocTypes(consumptionDocTypes, "consumptionDocTypes");
        validateDocTypes(productionDocTypes, "productionDocTypes");

        // 1️ CONSUMO — Cargar componentes dinámicamente
        List<String> consumoProductIds = cargarComponentesDinamicos(consumptionProductId);
        boolean useSumForConsumption = consultarUsaSuma(consumptionProductId);

        String consumoProductPlaceholders = consumoProductIds.stream()
            .map(id -> "?")
            .collect(Collectors.joining(", "));
            
        String consumoExpression = useSumForConsumption
            ? "SUM(CASE WHEN f470_ind_naturaleza = 2 THEN f470_cant_base ELSE 0 END + CASE WHEN f470_ind_naturaleza = 1 THEN f470_cant_base ELSE 0 END)"
            : "SUM(CASE WHEN f470_ind_naturaleza = 2 THEN f470_cant_base ELSE 0 END - CASE WHEN f470_ind_naturaleza = 1 THEN f470_cant_base ELSE 0 END)";

        String consumoDocPlaceholders = consumptionDocTypes.stream()
            .map(t -> "?")
            .collect(Collectors.joining(", "));

        String sqlConsumo = """
            SELECT
                CONVERT(VARCHAR, mov.f470_id_fecha, 23) AS fecha_documento,
                %s AS cantidad_consumida
            FROM [t124_mc_items_referencias]
            LEFT JOIN [t120_mc_items] item ON f120_rowid = f124_rowid_item
            INNER JOIN [t121_mc_items_extensiones] ON f121_rowid_item = f120_rowid
            INNER JOIN [t470_cm_movto_invent] mov ON mov.f470_rowid_item_ext = f121_rowid
            INNER JOIN [t350_co_docto_contable] doc ON doc.f350_rowid = mov.f470_rowid_docto
            INNER JOIN [t150_mc_bodegas] bod ON bod.f150_rowid = mov.f470_rowid_bodega
            WHERE mov.f470_id_fecha BETWEEN ? AND ?
              AND f120_id_cia = 2
              AND f350_ind_estado = 1
              AND f120_id IN (%s)
              AND f350_id_tipo_docto IN (%s)
            GROUP BY mov.f470_id_fecha
            ORDER BY mov.f470_id_fecha
            """.formatted(consumoExpression, consumoProductPlaceholders, consumoDocPlaceholders);

        Map<String, Double> consumoMap = new HashMap<>();
        double[] totalConsumption = { 0.0 };

        List<Object> consumoParams = new ArrayList<>();
        consumoParams.add(startDate);
        consumoParams.add(endDate);
        consumoParams.addAll(consumoProductIds);
        consumoParams.addAll(consumptionDocTypes);

        siesaJdbcTemplate.query(sqlConsumo, rs -> {
            String date = rs.getString("fecha_documento");
            double qty = rs.getDouble("cantidad_consumida");
            consumoMap.put(date, qty);
            totalConsumption[0] += qty;
        }, consumoParams.toArray());

        // 2️ PRODUCCIÓN
        String produccionPlaceholders = productionDocTypes.stream()
                .map(t -> "?")
                .collect(Collectors.joining(", "));

        String produccionExpression = "ABS(SUM(CASE WHEN f470_ind_naturaleza = 1 THEN f470_cant_base ELSE 0 END - CASE WHEN f470_ind_naturaleza = 2 THEN f470_cant_base ELSE 0 END))";

        String sqlProduccion = """
            SELECT
                CONVERT(VARCHAR, mov.f470_id_fecha, 23) AS fecha_documento,
                %s AS total_produccion
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
              AND f350_id_tipo_docto IN (%s)
            GROUP BY mov.f470_id_fecha
            ORDER BY mov.f470_id_fecha
            """.formatted(produccionExpression, produccionPlaceholders);

        Map<String, Double> produccionMap = new HashMap<>();
        double[] totalProduction = { 0.0 };

        List<Object> produccionParams = new ArrayList<>();
        produccionParams.add(startDate);
        produccionParams.add(endDate);
        produccionParams.add(productionProductId);
        produccionParams.addAll(productionDocTypes);

        siesaJdbcTemplate.query(sqlProduccion, rs -> {
            String date = rs.getString("fecha_documento");
            double qty = Math.max(rs.getDouble("total_produccion"), 0.001);
            produccionMap.put(date, qty);
            totalProduction[0] += qty;
        }, produccionParams.toArray());

        // 3️ CÁLCULO DIARIO
        List<CmiplantaDTO> dailyData = new ArrayList<>();

        for (String date : consumoMap.keySet()) {
            if (produccionMap.containsKey(date)) {
                double cons = consumoMap.get(date);
                double prod = produccionMap.get(date);
                double ratio = (cons / prod) * 1000;

                CmiplantaDTO rec = new CmiplantaDTO();
                rec.setDate(date);
                rec.setConsumo(cons);
                rec.setProduccion(prod);
                rec.setConsumo_diario(ratio);
                dailyData.add(rec);
            }
        }

        double monthlyAccumulated = (totalProduction[0] > 0)
                ? (totalConsumption[0] / totalProduction[0]) * 1000
                : 0;

        CmiplantaResponseDTO resp = new CmiplantaResponseDTO();
        resp.setDailyData(dailyData);
        resp.setMonthlyAccumulated(monthlyAccumulated);
        resp.setTotalConsumption(totalConsumption[0]);
        resp.setTotalProduction(totalProduction[0]);
        resp.setValidDays(dailyData.size());

        return resp;
    }

    // ========================================
    // MÉTODO ESPECÍFICO PARA B100
    // ========================================
    private CmiplantaResponseDTO generateB100Report(String startDate, String endDate) {
        
        // Tipos de documento fijos para B100
        List<String> docTypes = List.of("EDP", "EI", "SDI");
        String docPlaceholders = "?, ?, ?";

        // Consulta SQL exacta del PHP para B100
        String sql = """
            SELECT
                CONVERT(VARCHAR, mov.f470_id_fecha, 23) AS fecha_documento,
                SUM(
                    CASE WHEN f470_ind_naturaleza = 1 THEN f470_cant_base ELSE 0 END -
                    CASE WHEN f470_ind_naturaleza = 2 THEN f470_cant_base ELSE 0 END
                ) AS total_produccion
            FROM [t124_mc_items_referencias]
            LEFT JOIN [t120_mc_items] item ON f120_rowid = f124_rowid_item
            INNER JOIN [t121_mc_items_extensiones] ON f121_rowid_item = f120_rowid
            INNER JOIN [t470_cm_movto_invent] mov ON mov.f470_rowid_item_ext = f121_rowid
            INNER JOIN [t350_co_docto_contable] doc ON doc.f350_rowid = mov.f470_rowid_docto
            INNER JOIN [t150_mc_bodegas] bod ON bod.f150_rowid = mov.f470_rowid_bodega
            WHERE mov.f470_id_fecha BETWEEN ? AND ?
              AND f120_id_cia = 2
              AND f350_ind_estado = 1
              AND f120_id = '26'
              AND f350_id_tipo_docto IN (%s)
            GROUP BY mov.f470_id_fecha
            ORDER BY mov.f470_id_fecha
            """.formatted(docPlaceholders);

        List<CmiplantaDTO> dailyData = new ArrayList<>();
        double[] totalProduction = { 0.0 }; 

        List<Object> params = new ArrayList<>();
        params.add(startDate);
        params.add(endDate);
        params.addAll(docTypes);

        siesaJdbcTemplate.query(sql, rs -> {
            String date = rs.getString("fecha_documento");
            // Producción en kg (valor neto de entradas - salidas)
            double prodKg = rs.getDouble("total_produccion");
            // Convertir a toneladas
            double prodTon = prodKg / 1000.0;

            CmiplantaDTO rec = new CmiplantaDTO();
            rec.setDate(date);
            rec.setProduccion(prodTon); // En toneladas
            rec.setConsumo(0.0); // No aplica para B100
            rec.setConsumo_diario(0); // No aplica para B100
            
            dailyData.add(rec);
            totalProduction[0] += prodTon;
        }, params.toArray());

        CmiplantaResponseDTO resp = new CmiplantaResponseDTO();
        resp.setDailyData(dailyData);
        resp.setTotalProduction(totalProduction[0]); // En toneladas
        resp.setTotalConsumption(0.0);
        resp.setMonthlyAccumulated(0);
        resp.setValidDays(dailyData.size());

        return resp;
    }

    // Validación segura de tipos de documento
    private void validateDocTypes(List<String> docTypes, String paramName) {
        if (docTypes == null || docTypes.isEmpty()) {
            throw new IllegalArgumentException(paramName + " cannot be null or empty");
        }
        if (docTypes.size() > 20) {
            throw new IllegalArgumentException(paramName + " has too many elements (max 20)");
        }
        for (String type : docTypes) {
            if (type == null || type.trim().isEmpty()) {
                throw new IllegalArgumentException(paramName + " contains null or empty value");
            }
            if (!type.matches("^[A-Z0-9]{2,10}$")) {
                throw new IllegalArgumentException("Invalid document type in " + paramName + ": '" + type + "'");
            }
        }
    }
    
    // ========================================
    // MÉTODOS DINÁMICOS: Componentes de producto
    // ========================================
    
    /**
     * Carga los IDs Siesa de los componentes de un producto.
     * Si el producto no tiene componentes, retorna una lista con su propio ID Siesa.
     */
    private List<String> cargarComponentesDinamicos(String productoSiesaId) {
        try {
            // Buscar producto interno por su id_producto_siesa
            String sqlBuscar = "SELECT id FROM productos WHERE id_producto_siesa = ?";
            List<Map<String, Object>> prodRows = jdbcTemplate.queryForList(sqlBuscar, productoSiesaId);
            
            if (!prodRows.isEmpty()) {
                String productoInternoId = String.valueOf(prodRows.get(0).get("id"));
                
                String sqlComp = "SELECT producto_hijo_siesa_id FROM producto_componentes WHERE producto_padre_id = ? AND activo = 1";
                List<Map<String, Object>> compRows = jdbcTemplate.queryForList(sqlComp, productoInternoId);
                
                if (!compRows.isEmpty()) {
                    List<String> ids = new ArrayList<>();
                    for (Map<String, Object> row : compRows) {
                        ids.add(String.valueOf(row.get("producto_hijo_siesa_id")));
                    }
                    return ids;
                }
            }
        } catch (Exception e) {
            // Si falla la consulta, usar comportamiento por defecto
        }
        
        // Producto simple: retornar solo su propio ID
        List<String> singleList = new ArrayList<>();
        singleList.add(productoSiesaId);
        return singleList;
    }
    
    /**
     * Consulta si un producto usa fórmula de suma (naturaleza 1+2) en vez de resta (2-1).
     */
    private boolean consultarUsaSuma(String productoSiesaId) {
        try {
            String sql = "SELECT usa_suma FROM productos WHERE id_producto_siesa = ? AND activo = 1";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, productoSiesaId);
            
            if (!rows.isEmpty() && rows.get(0).get("usa_suma") != null) {
                Object val = rows.get(0).get("usa_suma");
                if (val instanceof Boolean) return (Boolean) val;
                if (val instanceof Number) return ((Number) val).intValue() == 1;
            }
        } catch (Exception e) {
            // Si falla, usar resta por defecto
        }
        return false;
    }

}
