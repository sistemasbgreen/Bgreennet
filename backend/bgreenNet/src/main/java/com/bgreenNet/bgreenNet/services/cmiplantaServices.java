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
            List<String> productionDocTypes,
            List<String> consumptionDocOrigenIds,
            List<String> productionDocOrigenIds) {

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
        
        // Resolver y autocompletar tipos de documento de producción si vienen vacíos
        List<String> finalProdDocTypes = productionDocTypes;
        List<String> finalProdDocOrigenIds = productionDocOrigenIds;
        
        if (finalProdDocTypes == null || finalProdDocTypes.isEmpty()) {
            finalProdDocTypes = new ArrayList<>();
            finalProdDocOrigenIds = new ArrayList<>();
            try {
                String sqlFindInternal = "SELECT id FROM productos WHERE id = ? OR id_producto_siesa = ?";
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(sqlFindInternal, productionProductId, productionProductId);
                if (!rows.isEmpty()) {
                    String internalId = String.valueOf(rows.get(0).get("id"));
                    String sqlDocs = "SELECT td.codigo as doc_cod, ptd.producto_origen_id " +
                                     "FROM producto_tipos_documento ptd " +
                                     "JOIN tipo_movimiento tm ON ptd.tipo_movimiento_id = tm.id " +
                                     "JOIN tipos_documento td ON ptd.tipo_documento_id = td.id " +
                                     "WHERE ptd.producto_id = ? AND tm.codigo = 'PRODUCCION'";
                    List<Map<String, Object>> docRows = jdbcTemplate.queryForList(sqlDocs, internalId);
                    for (Map<String, Object> r : docRows) {
                        finalProdDocTypes.add(String.valueOf(r.get("doc_cod")));
                        finalProdDocOrigenIds.add(r.get("producto_origen_id") != null ? String.valueOf(r.get("producto_origen_id")) : "null");
                    }
                }
            } catch (Exception e) {
                // fall back
            }
        }

        // Validar tipos de documento
        validateDocTypes(consumptionDocTypes, "consumptionDocTypes");
        validateDocTypes(finalProdDocTypes, "productionDocTypes");

        // Resolver el producto correcto en base a ID o Siesa ID para evitar duplicidades/cruces erróneos
        String resolvedId = consumptionProductId;
        String resolvedSiesaId = consumptionProductId;
        try {
            String sqlFindProduct = "SELECT id, id_producto_siesa FROM productos WHERE id = ? OR id_producto_siesa = ?";
            List<Map<String, Object>> pRows = jdbcTemplate.queryForList(sqlFindProduct, consumptionProductId, consumptionProductId);
            if (!pRows.isEmpty()) {
                Map<String, Object> bestRow = pRows.get(0);
                for (Map<String, Object> row : pRows) {
                    String siesaId = row.get("id_producto_siesa") != null ? String.valueOf(row.get("id_producto_siesa")).trim() : "";
                    String internalId = row.get("id") != null ? String.valueOf(row.get("id")).trim() : "";
                    if (siesaId.equals(consumptionProductId)) {
                        bestRow = row;
                        break;
                    } else if (internalId.equals(consumptionProductId)) {
                        bestRow = row;
                    }
                }
                resolvedId = String.valueOf(bestRow.get("id"));
                Object siesaObj = bestRow.get("id_producto_siesa");
                resolvedSiesaId = siesaObj != null ? String.valueOf(siesaObj).trim() : resolvedId;
            }
        } catch (Exception e) {
            // fall back
        }

        Map<String, Double> consumoMap = new HashMap<>();
        double[] totalConsumption = { 0.0 };

        // 1️ CONSUMO — Cargar componentes dinámicamente
        if (consumptionDocTypes != null && !consumptionDocTypes.isEmpty()) {
            List<String> consumoProductIds = cargarComponentesDinamicos(resolvedSiesaId);
            boolean useSumForConsumption = consultarUsaSuma(resolvedSiesaId);
            
            // Cargar vinculaciones locales de documentos para conocer su orden y origen
            String sqlLocalDocs = "SELECT td.codigo as doc_cod, ptd.orden, ptd.producto_origen_id " +
                                  "FROM producto_tipos_documento ptd " +
                                  "JOIN tipo_movimiento tm ON ptd.tipo_movimiento_id = tm.id " +
                                  "JOIN tipos_documento td ON ptd.tipo_documento_id = td.id " +
                                  "WHERE ptd.producto_id = ? " +
                                  "AND tm.codigo = 'CONSUMO'";
            List<Map<String, Object>> docMappings = jdbcTemplate.queryForList(sqlLocalDocs, resolvedId);
            
            // Cargar operadores de la fórmula
            List<String> formulaOps = new ArrayList<>();
            try {
                String sqlOps = "SELECT formula_operadores FROM productos WHERE id = ?";
                List<Map<String, Object>> opRows = jdbcTemplate.queryForList(sqlOps, resolvedId);
                if (!opRows.isEmpty() && opRows.get(0).get("formula_operadores") != null) {
                    String opsStr = String.valueOf(opRows.get(0).get("formula_operadores"));
                    formulaOps = java.util.Arrays.asList(opsStr.split(","));
                }
            } catch (Exception e) {
                // fall back
            }
            if (formulaOps.isEmpty()) {
                formulaOps = java.util.Arrays.asList("+", "+", "+", "+");
            }

            // Construir lógica de filtrado de documentos por producto
            StringBuilder docFilterBuilder = new StringBuilder();
            List<Object> consumoParams = new ArrayList<>();
            consumoParams.add(startDate);
            consumoParams.add(endDate);
            
            docFilterBuilder.append(" AND (");
            for (int i = 0; i < consumptionDocTypes.size(); i++) {
                if (i > 0) docFilterBuilder.append(" OR ");
                
                String docType = consumptionDocTypes.get(i);
                String origenId = (consumptionDocOrigenIds != null && i < consumptionDocOrigenIds.size()) ? consumptionDocOrigenIds.get(i) : null;
                
                if (origenId != null && !origenId.trim().isEmpty() && !origenId.equals("null")) {
                    docFilterBuilder.append("(f120_id = ? AND f350_id_tipo_docto = ?)");
                    consumoParams.add(origenId);
                    consumoParams.add(docType);
                } else {
                    String placeholders = consumoProductIds.stream().map(id -> "?").collect(Collectors.joining(", "));
                    if (placeholders.isEmpty()) {
                        placeholders = "?";
                        consumoProductIds.add(consumptionProductId);
                    }
                    docFilterBuilder.append("(f120_id IN (").append(placeholders).append(") AND f350_id_tipo_docto = ?)");
                    consumoParams.addAll(consumoProductIds);
                    consumoParams.add(docType);
                }
            }
            docFilterBuilder.append(")");

            String sqlConsumo = """
                SELECT
                    CONVERT(VARCHAR, mov.f470_id_fecha, 23) AS fecha_documento,
                    doc.f350_id_tipo_docto AS tipo_docto,
                    item.f120_id AS item_id,
                    SUM(CASE WHEN f470_ind_naturaleza = 2 THEN f470_cant_base ELSE 0 END) AS salidas,
                    SUM(CASE WHEN f470_ind_naturaleza = 1 THEN f470_cant_base ELSE 0 END) AS entradas
                FROM [t124_mc_items_referencias]
                LEFT JOIN [t120_mc_items] item ON f120_rowid = f124_rowid_item
                INNER JOIN [t121_mc_items_extensiones] ON f121_rowid_item = f120_rowid
                INNER JOIN [t470_cm_movto_invent] mov ON mov.f470_rowid_item_ext = f121_rowid
                INNER JOIN [t350_co_docto_contable] doc ON doc.f350_rowid = mov.f470_rowid_docto
                INNER JOIN [t150_mc_bodegas] bod ON bod.f150_rowid = mov.f470_rowid_bodega
                WHERE mov.f470_id_fecha BETWEEN ? AND ?
                  AND f120_id_cia = 2
                  AND f350_ind_estado = 1
                  %s
                GROUP BY mov.f470_id_fecha, doc.f350_id_tipo_docto, item.f120_id
                ORDER BY mov.f470_id_fecha
                """.formatted(docFilterBuilder.toString());

            Map<String, double[]> dailyZoneSums = new HashMap<>();
            final List<Map<String, Object>> finalDocMappings = docMappings;
            
            final String finalResolvedSiesaId = resolvedSiesaId;
            siesaJdbcTemplate.query(sqlConsumo, rs -> {
                String date = rs.getString("fecha_documento");
                String tipoDocto = rs.getString("tipo_docto");
                String itemId = rs.getString("item_id");
                double salidas = rs.getDouble("salidas");
                double entradas = rs.getDouble("entradas");
                
                String cleanTipoDocto = tipoDocto != null ? tipoDocto.trim() : "";
                String cleanItemId = itemId != null ? itemId.trim() : "";
                
                double netVal;
                if (useSumForConsumption) {
                    netVal = salidas + entradas;
                } else {
                    boolean isEntrada = cleanTipoDocto.equals("EI") || cleanTipoDocto.equals("EDP") || cleanTipoDocto.equals("AI") || cleanTipoDocto.equals("EPA") || cleanTipoDocto.startsWith("E") || cleanTipoDocto.startsWith("A");
                    if ("10".equals(finalResolvedSiesaId)) {
                        isEntrada = false;
                    }
                    netVal = isEntrada ? (entradas - salidas) : (salidas - entradas);
                }

                Map<String, Object> bestMatch = null;
                for (Map<String, Object> map : finalDocMappings) {
                    String mapDoc = map.get("doc_cod") != null ? String.valueOf(map.get("doc_cod")).trim() : "";
                    Object mapOrigenObj = map.get("producto_origen_id");
                    String mapOrigen = mapOrigenObj != null ? String.valueOf(mapOrigenObj).trim() : "";
                    
                    if (mapDoc.equals(cleanTipoDocto)) {
                        if (!mapOrigen.isEmpty() && !mapOrigen.equalsIgnoreCase("null") && mapOrigen.equals(cleanItemId)) {
                            bestMatch = map;
                            break;
                        }
                    }
                }
                
                if (bestMatch == null) {
                    for (Map<String, Object> map : finalDocMappings) {
                        String mapDoc = map.get("doc_cod") != null ? String.valueOf(map.get("doc_cod")).trim() : "";
                        Object mapOrigenObj = map.get("producto_origen_id");
                        String mapOrigen = mapOrigenObj != null ? String.valueOf(mapOrigenObj).trim() : "";
                        
                        if (mapDoc.equals(cleanTipoDocto)) {
                            if (mapOrigen.isEmpty() || mapOrigen.equalsIgnoreCase("null")) {
                                bestMatch = map;
                                break;
                            }
                        }
                    }
                }
                
                if (bestMatch != null) {
                    Object mapOrdenObj = bestMatch.get("orden");
                    int orden = (mapOrdenObj instanceof Number) ? ((Number) mapOrdenObj).intValue() : 0;
                    int zoneIdx = Math.min(4, Math.max(0, orden / 100));
                    dailyZoneSums.putIfAbsent(date, new double[5]);
                    dailyZoneSums.get(date)[zoneIdx] += netVal;
                }
            }, consumoParams.toArray());

            final List<String> finalFormulaOps = formulaOps;
            for (Map.Entry<String, double[]> entry : dailyZoneSums.entrySet()) {
                String date = entry.getKey();
                double[] zones = entry.getValue();
                
                double result = zones[0];
                for (int i = 0; i < 4; i++) {
                    String op = (i < finalFormulaOps.size()) ? finalFormulaOps.get(i).trim() : "+";
                    double nextVal = zones[i + 1];
                    if ("/".equals(op)) {
                        result = (nextVal != 0) ? (result / nextVal) : 0.0;
                    } else if ("-".equals(op)) {
                        result -= nextVal;
                    } else {
                        result += nextVal;
                    }
                }
                
                double qty = result;
                consumoMap.put(date, qty);
                totalConsumption[0] += qty;
            }
        }

        Map<String, Double> produccionMap = new HashMap<>();
        double[] totalProduction = { 0.0 };

        // 2️ PRODUCCIÓN
        if (finalProdDocTypes != null && !finalProdDocTypes.isEmpty()) {
            List<String> produccionProductIds = cargarComponentesDinamicos(productionProductId);
            StringBuilder docFilterBuilder = new StringBuilder();
            List<Object> produccionParams = new ArrayList<>();
            produccionParams.add(startDate);
            produccionParams.add(endDate);

            docFilterBuilder.append(" AND (");
            for (int i = 0; i < finalProdDocTypes.size(); i++) {
                if (i > 0) docFilterBuilder.append(" OR ");
                
                String docType = finalProdDocTypes.get(i);
                String origenId = (finalProdDocOrigenIds != null && i < finalProdDocOrigenIds.size()) ? finalProdDocOrigenIds.get(i) : null;
                
                if (origenId != null && !origenId.trim().isEmpty() && !origenId.equals("null")) {
                    docFilterBuilder.append("(f120_id = ? AND f350_id_tipo_docto = ?)");
                    produccionParams.add(origenId);
                    produccionParams.add(docType);
                } else {
                    String placeholders = produccionProductIds.stream().map(id -> "?").collect(Collectors.joining(", "));
                    if (placeholders.isEmpty()) {
                        placeholders = "?";
                        produccionProductIds.add(productionProductId);
                    }
                    docFilterBuilder.append("(f120_id IN (").append(placeholders).append(") AND f350_id_tipo_docto = ?)");
                    produccionParams.addAll(produccionProductIds);
                    produccionParams.add(docType);
                }
            }
            docFilterBuilder.append(")");

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
                  %s
                GROUP BY mov.f470_id_fecha
                ORDER BY mov.f470_id_fecha
                """.formatted(produccionExpression, docFilterBuilder.toString());

            siesaJdbcTemplate.query(sqlProduccion, rs -> {
                String date = rs.getString("fecha_documento");
                double qty = Math.max(rs.getDouble("total_produccion"), 0.001);
                produccionMap.put(date, qty);
                totalProduction[0] += qty;
            }, produccionParams.toArray());
        }

        // 3️ CÁLCULO DIARIO
        List<CmiplantaDTO> dailyData = new ArrayList<>();
        
        java.util.Set<String> allDates = new java.util.TreeSet<>();
        allDates.addAll(consumoMap.keySet());
        allDates.addAll(produccionMap.keySet());
        
        boolean isConsumoEspecifico = (finalProdDocTypes != null && !finalProdDocTypes.isEmpty());

        for (String date : allDates) {
            double cons = consumoMap.getOrDefault(date, 0.0);
            double prod = produccionMap.getOrDefault(date, 0.0);
            
            double ratio = 0.0;
            if (isConsumoEspecifico) {
                ratio = (prod > 0) ? (cons / prod) * 1000 : 0.0;
            } else {
                ratio = cons; // Consumo absoluto si no hay documentos de producción
            }

            CmiplantaDTO rec = new CmiplantaDTO();
            rec.setDate(date);
            rec.setConsumo(cons);
            rec.setProduccion(prod);
            rec.setConsumo_diario(ratio);
            dailyData.add(rec);
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
            return;
        }
        if (docTypes.size() > 20) {
            throw new IllegalArgumentException(paramName + " has too many elements (max 20)");
        }
        for (String type : docTypes) {
            if (type == null || type.trim().isEmpty()) {
                throw new IllegalArgumentException(paramName + " contains null or empty value");
            }
            if (!type.matches("^[a-zA-Z0-9_-]{1,20}$")) {
                throw new IllegalArgumentException("Invalid document type in " + paramName + ": '" + type + "'");
            }
        }
    }
    
    // ========================================
    // MÉTODOS DINÁMICOS: Componentes de producto
    // ========================================
    
    private List<String> cargarComponentesDinamicos(String productoSiesaId) {
        if (productoSiesaId != null && productoSiesaId.contains(",")) {
            return java.util.Arrays.stream(productoSiesaId.split(","))
                         .map(String::trim)
                         .filter(s -> !s.isEmpty())
                         .collect(Collectors.toList());
        }
        try {
            // Buscar producto interno por su id o su id_producto_siesa
            String sqlBuscar = "SELECT id, id_producto_siesa FROM productos WHERE id = ? OR id_producto_siesa = ?";
            List<Map<String, Object>> prodRows = jdbcTemplate.queryForList(sqlBuscar, productoSiesaId, productoSiesaId);
            
            if (!prodRows.isEmpty()) {
                String productoInternoId = String.valueOf(prodRows.get(0).get("id"));
                Object siesaIdObj = prodRows.get(0).get("id_producto_siesa");
                String siesaId = siesaIdObj != null ? String.valueOf(siesaIdObj) : null;
                
                String sqlComp = "SELECT producto_hijo_siesa_id FROM producto_componentes WHERE producto_padre_id = ? AND (activo = 1 OR activo IS NULL)";
                List<Map<String, Object>> compRows = jdbcTemplate.queryForList(sqlComp, productoInternoId);
                
                if (!compRows.isEmpty()) {
                    List<String> ids = new ArrayList<>();
                    // Incluir el ID de Siesa del padre si existe
                    if (siesaId != null && !siesaId.trim().isEmpty()) {
                        ids.add(siesaId);
                    }
                    
                    for (Map<String, Object> row : compRows) {
                        String hijoId = String.valueOf(row.get("producto_hijo_siesa_id"));
                        if (!ids.contains(hijoId)) {
                            ids.add(hijoId);
                        }
                    }
                    if (!ids.isEmpty()) {
                        return ids;
                    }
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
            String sql = "SELECT usa_suma FROM productos WHERE (id = ? OR id_producto_siesa = ?) AND (activo = 1 OR activo IS NULL)";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, productoSiesaId, productoSiesaId);
            
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
