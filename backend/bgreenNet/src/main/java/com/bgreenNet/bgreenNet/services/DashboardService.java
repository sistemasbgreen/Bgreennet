package com.bgreenNet.bgreenNet.services;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.models.ConsumoData;
import com.bgreenNet.bgreenNet.models.CostoMEOHData;
import com.bgreenNet.bgreenNet.models.ProduccionData;
import com.bgreenNet.bgreenNet.models.RegistroDiario;
import com.bgreenNet.bgreenNet.models.ResultadoDashboard;

@Service
public class DashboardService {



    private final JdbcTemplate siesaJdbcTemplate;

    public DashboardService(@Qualifier("siesaJdbcTemplate") JdbcTemplate siesaJdbcTemplate) {
        this.siesaJdbcTemplate = siesaJdbcTemplate;
    }

    // === Consultas SQL idénticas al PHP (con nombres completos de 4 partes) ===
    private static final String SQL_CONSUMO = """
        SELECT
            CONVERT(VARCHAR, mov.f470_id_fecha, 23) AS fecha_documento,
            f120_id AS producto_id,
            SUM(
                CASE WHEN f470_ind_naturaleza = 2 THEN f470_cant_base ELSE 0 END -
                CASE WHEN f470_ind_naturaleza = 1 THEN f470_cant_base ELSE 0 END
            ) AS cantidad_consumida
        FROM [t124_mc_items_referencias]
        LEFT JOIN [t120_mc_items] item
            ON f120_rowid = f124_rowid_item
        INNER JOIN [t121_mc_items_extensiones]
            ON f121_rowid_item = f120_rowid
        INNER JOIN [t470_cm_movto_invent] mov
            ON mov.f470_rowid_item_ext = f121_rowid
        INNER JOIN [t350_co_docto_contable] doc
            ON doc.f350_rowid = mov.f470_rowid_docto
        INNER JOIN [t150_mc_bodegas] bod
            ON bod.f150_rowid = mov.f470_rowid_bodega
        WHERE mov.f470_id_fecha BETWEEN ? AND ?
          AND f120_id_cia = 2
          AND f350_ind_estado = 1
          AND f120_id IN ('8', '10')
          AND f350_id_tipo_docto IN ('TEP','EI')
        GROUP BY CONVERT(VARCHAR, mov.f470_id_fecha, 23), f120_id
        ORDER BY f120_id, CONVERT(VARCHAR, mov.f470_id_fecha, 23)
        """;

    private static final String SQL_PRODUCCION = """
        SELECT
            CONVERT(VARCHAR, mov.f470_id_fecha, 23) AS fecha_documento,
            SUM(f470_cant_base) AS canti,
            SUM(f470_costo_prom_tot) AS costo_bruto
        FROM [t124_mc_items_referencias]
        LEFT JOIN [t120_mc_items] item
            ON f120_rowid = f124_rowid_item
        INNER JOIN [t121_mc_items_extensiones]
            ON f121_rowid_item = f120_rowid
        INNER JOIN [t470_cm_movto_invent] mov
            ON mov.f470_rowid_item_ext = f121_rowid
        INNER JOIN [t350_co_docto_contable] doc
            ON doc.f350_rowid = mov.f470_rowid_docto
        INNER JOIN [t150_mc_bodegas] bod
            ON bod.f150_rowid = mov.f470_rowid_bodega
        WHERE mov.f470_id_fecha BETWEEN ? AND ?
          AND f120_id_cia = 2
          AND f120_id = '26'
          AND f350_id_tipo_docto IN ('EDP' , 'EI')
          AND f350_ind_estado = 1
        GROUP BY CONVERT(VARCHAR, mov.f470_id_fecha, 23)
        """;

    private static final String SQL_COSTO_MEOH = """
        SELECT
            CONVERT(VARCHAR, mov.f470_id_fecha, 23) AS fecha_documento,
            SUM(f470_costo_prom_tot) AS costo_bruto
        FROM [t124_mc_items_referencias]
        LEFT JOIN [t120_mc_items] item
            ON f120_rowid = f124_rowid_item
        INNER JOIN [t121_mc_items_extensiones]
            ON f121_rowid_item = f120_rowid
        INNER JOIN [t470_cm_movto_invent] mov
            ON mov.f470_rowid_item_ext = f121_rowid
        INNER JOIN [t350_co_docto_contable] doc
            ON doc.f350_rowid = mov.f470_rowid_docto
        INNER JOIN [t150_mc_bodegas] bod
            ON bod.f150_rowid = mov.f470_rowid_bodega
        WHERE mov.f470_id_fecha BETWEEN ? AND ?
          AND f120_id_cia = 2
          AND f120_id = '10'
          AND f350_id_tipo_docto = 'EI'
          AND f350_ind_estado = 1
        GROUP BY CONVERT(VARCHAR, mov.f470_id_fecha, 23)
        """;

    // Row mappers
    private final org.springframework.jdbc.core.RowMapper<ConsumoData> consumoRowMapper = (rs, rowNum) -> {
        ConsumoData c = new ConsumoData();
        c.setFechaDocumento(rs.getString("fecha_documento"));
        c.setProductoId(rs.getString("producto_id"));
        c.setCantidadConsumida(rs.getDouble("cantidad_consumida"));
        return c;
    };

    private final org.springframework.jdbc.core.RowMapper<ProduccionData> produccionRowMapper = (rs, rowNum) -> {
        ProduccionData p = new ProduccionData();
        p.setFechaDocumento(rs.getString("fecha_documento"));
        p.setCanti(rs.getDouble("canti"));
        p.setCostoBruto(rs.getDouble("costo_bruto"));
        return p;
    };

    private final org.springframework.jdbc.core.RowMapper<CostoMEOHData> costoMEOHRowMapper = (rs, rowNum) -> {
        CostoMEOHData m = new CostoMEOHData();
        m.setFechaDocumento(rs.getString("fecha_documento"));
        m.setCostoBruto(rs.getDouble("costo_bruto"));
        return m;
    };

    // Método principal
    public ResultadoDashboard calcularResultados(LocalDate fechaInicio, LocalDate fechaFin) {
        String inicioStr = fechaInicio.toString();
        String finStr = fechaFin.toString();

        List<ConsumoData> consumo = siesaJdbcTemplate.query(SQL_CONSUMO, consumoRowMapper, inicioStr, finStr);
        List<ProduccionData> produccion = siesaJdbcTemplate.query(SQL_PRODUCCION, produccionRowMapper, inicioStr, finStr);
        List<CostoMEOHData> costoMEOH = siesaJdbcTemplate.query(SQL_COSTO_MEOH, costoMEOHRowMapper, inicioStr, finStr);

        // Mapear por fecha
        Map<String, ProduccionData> produccionMap = produccion.stream()
                .collect(Collectors.toMap(ProduccionData::getFechaDocumento, p -> p));

        Map<String, Double> costoMEOHMap = costoMEOH.stream()
                .collect(Collectors.toMap(CostoMEOHData::getFechaDocumento, CostoMEOHData::getCostoBruto));

        Map<String, Double> consumo8Map = new HashMap<>();
        Map<String, Double> consumo10Map = new HashMap<>();
        for (ConsumoData c : consumo) {
            if ("8".equals(c.getProductoId())) {
                consumo8Map.put(c.getFechaDocumento(), c.getCantidadConsumida());
            } else if ("10".equals(c.getProductoId())) {
                consumo10Map.put(c.getFechaDocumento(), c.getCantidadConsumida());
            }
        }

        Set<String> todasFechas = new HashSet<>();
        todasFechas.addAll(produccionMap.keySet());
        todasFechas.addAll(costoMEOHMap.keySet());
        todasFechas.addAll(consumo8Map.keySet());
        todasFechas.addAll(consumo10Map.keySet());
        List<String> fechasOrdenadas = nuevasFechasOrdenadas(todasFechas);

        double acumulado8 = 0;
        double acumulado10 = 0;
        double produccionAcumulada = 0;
        double costoEDPAcum = 0;
        double costoEIAcum = 0;
        double cantiAcum = 0;

        List<RegistroDiario> registros = new ArrayList<>();

        for (String fecha : fechasOrdenadas) {
            ProduccionData prod = produccionMap.get(fecha);
            double canti = (prod != null) ? prod.getCanti() : 0.0;
            double costoB100 = (prod != null) ? prod.getCostoBruto() : 0.0;
            double costoMEOHVal = costoMEOHMap.getOrDefault(fecha, 0.0);
            double cons8 = consumo8Map.getOrDefault(fecha, 0.0);
            double cons10 = consumo10Map.getOrDefault(fecha, 0.0);

            produccionAcumulada += canti;
            acumulado8 += cons8;
            acumulado10 += cons10;
            cantiAcum += canti;
            costoEDPAcum += costoB100;
            costoEIAcum += costoMEOHVal;

            Double consumoDiario8 = (canti > 0) ? round((cons8 * 1000.0) / canti, 4) : null;
            Double consumoDiario10 = (canti > 0) ? round((cons10 * 1000.0) / canti, 4) : null;
            Double ce8 = (produccionAcumulada > 0) ? round((acumulado8 * 1000.0) / produccionAcumulada, 4) : null;
            Double ce10 = (produccionAcumulada > 0) ? round((acumulado10 * 1000.0) / produccionAcumulada, 4) : null;

            Double costoNetoDiario = (canti > 0) ? (costoB100 - costoMEOHVal) / canti : null;
            costoNetoDiario = costoNetoDiario != null ? round(costoNetoDiario, 1) : null;

            Double costoNetoAcumulado = (cantiAcum > 0) ? (costoEDPAcum - costoEIAcum) / cantiAcum : null;
            costoNetoAcumulado = costoNetoAcumulado != null ? round(costoNetoAcumulado, 1) : null;

            RegistroDiario reg = new RegistroDiario();
            reg.setFechaDocumento(fecha);
            reg.setConsumoDiario8(consumoDiario8);
            reg.setConsumoDiario10(consumoDiario10);
            reg.setCe8(ce8);
            reg.setCe10(ce10);
            reg.setCostoNetoDiario(costoNetoDiario);
            reg.setCostoNetoAcumulado(costoNetoAcumulado);
            reg.setProduccionTon(canti);
            registros.add(reg);
        }

        // Construir listas
        List<String> fechas = registros.stream().map(RegistroDiario::getFechaDocumento).collect(Collectors.toList());
        List<Double> diario8 = registros.stream().map(RegistroDiario::getConsumoDiario8).collect(Collectors.toList());
        List<Double> diario10 = registros.stream().map(RegistroDiario::getConsumoDiario10).collect(Collectors.toList());
        List<Double> acumulado81 = registros.stream().map(RegistroDiario::getCe8).collect(Collectors.toList());
        List<Double> acumulado101 = registros.stream().map(RegistroDiario::getCe10).collect(Collectors.toList());
        List<Double> costoDiario = registros.stream().map(RegistroDiario::getCostoNetoDiario).collect(Collectors.toList());
        List<Double> costoAcumulado = registros.stream().map(RegistroDiario::getCostoNetoAcumulado).collect(Collectors.toList());
        List<Double> produccionTon = registros.stream().map(RegistroDiario::getProduccionTon).collect(Collectors.toList());

        ResultadoDashboard resultado = new ResultadoDashboard();
        resultado.setFechas(fechas);
        resultado.setDiario8(diario8);
        resultado.setDiario10(diario10);
        resultado.setAcumulado8(acumulado81);
        resultado.setAcumulado10(acumulado101);
        resultado.setCostoDiario(costoDiario);
        resultado.setCostoAcumulado(costoAcumulado);
        resultado.setProduccionTon(produccionTon);
        resultado.setCostoNetoDiario(costoDiario);
        resultado.setDatosCompletos(registros);

        return resultado;
    }

    private List<String> nuevasFechasOrdenadas(Set<String> fechas) {
        return fechas.stream().sorted().collect(Collectors.toList());
    }

    private double round(double value, int places) {
        double scale = Math.pow(10, places);
        return Math.round(value * scale) / scale;
    }
    
}
