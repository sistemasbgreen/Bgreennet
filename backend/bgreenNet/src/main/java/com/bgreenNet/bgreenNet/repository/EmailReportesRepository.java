package com.bgreenNet.bgreenNet.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.bgreenNet.bgreenNet.dto.DetalleInsumoDTO;
import com.bgreenNet.bgreenNet.dto.ResumenCostosDTO;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

@Repository
public class EmailReportesRepository {

    @Autowired
    @Qualifier("siesaJdbcTemplate")
    private JdbcTemplate jdbcTemplate;

    public ResumenCostosDTO obtenerResumenCostos(LocalDate fechaInicio, LocalDate fechaFin) {
        String sql = "SELECT " +
            " SUM(CASE WHEN t865.f865_descripcion_operacion = 'PURIFICACION GLICERINA' THEN c.f881_costo_este_nivel_total ELSE 0 END) AS total_purificacion_glicerina, " +
            " SUM(CASE WHEN t804.f804_descripcion IN ('MANO DE OBRA DIRECTA', 'FACTOR PRESTACIONAL DE MOD') AND t865.f865_descripcion_operacion <> 'PURIFICACION GLICERINA' THEN c.f881_costo_este_nivel_total ELSE 0 END) AS total_mano_obra, " +
            " SUM(CASE WHEN NOT (t865.f865_descripcion_operacion = 'PURIFICACION GLICERINA' OR t804.f804_descripcion IN ('MANO DE OBRA DIRECTA', 'FACTOR PRESTACIONAL DE MOD')) THEN c.f881_costo_este_nivel_total ELSE 0 END) AS total_otros_costos " +
            " FROM t881_mf_movto_tep_costo c " +
            " INNER JOIN t880_mf_movto_tep t ON t.f880_rowid = c.f881_rowid_movto_tep " +
            " INNER JOIN t865_mf_op_operaciones t865 ON t865.f865_rowid = t.f880_rowid_op_operaciones " +
            " INNER JOIN t804_mf_segmentos_costos t804 ON t804.f804_id = c.f881_id_segmento_costo " +
            " WHERE t.f880_id_fecha >= ? AND t.f880_id_fecha < ?";

        Object[] params = {
            java.sql.Timestamp.valueOf(fechaInicio.atStartOfDay()),
            java.sql.Timestamp.valueOf(fechaFin.atStartOfDay())
        };

        try {
            return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
                ResumenCostosDTO dto = new ResumenCostosDTO();
                dto.setTotalPurificacionGlicerina(rs.getBigDecimal("total_purificacion_glicerina"));
                dto.setTotalManoObra(rs.getBigDecimal("total_mano_obra"));
                dto.setTotalOtrosCostos(rs.getBigDecimal("total_otros_costos"));
                return dto;
            }, params);
        } catch (Exception e) {
            System.err.println("Error en obtenerResumenCostos: " + e.getMessage());
            return new ResumenCostosDTO(); // Retornar vacío en lugar de null
        }
    }

    public List<DetalleInsumoDTO> obtenerDetalleInsumos(LocalDate fechaInicio, LocalDate fechaFin) {
        String sql = "SELECT " +
            "    f120_id AS item, " +
            "    f120_descripcion, " +
            "    CAST(mov.f470_id_fecha AS DATE) AS fecha, " +
            "    ABS(SUM( " +
            "        CASE WHEN f470_ind_naturaleza = 1 THEN f470_cant_base ELSE 0 END " +
            "        - " +
            "        CASE WHEN f470_ind_naturaleza = 2 THEN f470_cant_base ELSE 0 END " +
            "    )) AS cantidad_consumida " +
            "FROM [t124_mc_items_referencias] " +
            "LEFT JOIN [t120_mc_items] itm " +
            "    ON itm.f120_rowid = f124_rowid_item " +
            "INNER JOIN [t121_mc_items_extensiones] " +
            "    ON f121_rowid_item = itm.f120_rowid " +
            "INNER JOIN [t470_cm_movto_invent] mov " +
            "    ON mov.f470_rowid_item_ext = f121_rowid " +
            "INNER JOIN [t350_co_docto_contable] doc " +
            "    ON doc.f350_rowid = mov.f470_rowid_docto " +
            "INNER JOIN [t150_mc_bodegas] bod " +
            "    ON bod.f150_rowid = mov.f470_rowid_bodega " +
            "WHERE " +
            "    mov.f470_id_fecha >= ? " +
            "    AND mov.f470_id_fecha < ? " +
            "    AND itm.f120_id_cia = 2 " +
            "    AND doc.f350_ind_estado = 1 " +
            "    AND itm.f120_id IN ('8','7309','10','13','12','26','34','15','2549','32') " +
            "    AND doc.f350_id_tipo_docto IN ('TEP','EI','SDI','EDP') " +
            "    AND NOT (itm.f120_id = '34' AND doc.f350_id_tipo_docto = 'EDP') " +
            "    AND doc.f350_rowid NOT IN ('695891','696066','692530') " +
            "GROUP BY " +
            "    itm.f120_id, " +
            "    itm.f120_descripcion, " +
            "    CAST(mov.f470_id_fecha AS DATE) " +
            "ORDER BY " +
            "    itm.f120_id, " +
            "    itm.f120_descripcion, " +
            "    fecha";

        Object[] params = {
            java.sql.Timestamp.valueOf(fechaInicio.atStartOfDay()),
            java.sql.Timestamp.valueOf(fechaFin.atStartOfDay())
        };

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            DetalleInsumoDTO dto = new DetalleInsumoDTO();
            dto.setItem(rs.getString("item"));
            dto.setDescripcion(rs.getString("f120_descripcion"));
            Date sqlDate = rs.getDate("fecha");
            if (sqlDate != null) {
                dto.setFecha(sqlDate.toLocalDate());
            }
            dto.setCantidadConsumida(rs.getBigDecimal("cantidad_consumida"));
            return dto;
        }, params);
    }
}