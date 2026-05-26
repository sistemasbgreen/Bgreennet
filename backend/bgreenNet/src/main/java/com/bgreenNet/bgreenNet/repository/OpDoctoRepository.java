// repository/OpDoctoRepository.java
package com.bgreenNet.bgreenNet.repository;

import com.bgreenNet.bgreenNet.dto.OpDoctoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public class OpDoctoRepository {

    @Autowired
    @Qualifier("siesaJdbcTemplate")
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JdbcTemplate appJdbcTemplate;

    private final RowMapper<OpDoctoDTO> rowMapper = (rs, rowNum) -> {
        OpDoctoDTO d = new OpDoctoDTO();
        d.setOp(rs.getString("OP"));
        d.setItem(rs.getString("item"));
        d.setDescripcion(rs.getString("f120_descripcion"));

        var fecha = rs.getDate("fecha");
        if (fecha != null) d.setFecha(fecha.toLocalDate());

        d.setCantidadConsumida(rs.getDouble("cantidad_consumida"));
        
        // Cost values from the join
        d.setTotalPurificacionGlicerina(rs.getDouble("total_purificacion_glicerina"));
        d.setTotalManoObra(rs.getDouble("total_mano_obra"));
        d.setTotalOtrosCostos(rs.getDouble("total_otros_costos"));
        d.setIdOrden(rs.getString("id_orden"));
        
        return d;
    };

	public List<OpDoctoDTO> findAll() {
		return findByRangoFechas(
			LocalDate.now().minusDays(15),
			LocalDate.now()
		);
	}

    public List<String> obtenerSiesaIdsActivos() {
        try {
            List<String> simpleIds = appJdbcTemplate.queryForList(
                "SELECT DISTINCT id_producto_siesa FROM productos WHERE activo = 1 AND id_producto_siesa IS NOT NULL AND id_producto_siesa <> ''",
                String.class
            );
            List<String> componentIds = appJdbcTemplate.queryForList(
                "SELECT DISTINCT producto_hijo_siesa_id FROM producto_componentes WHERE activo = 1 AND producto_hijo_siesa_id IS NOT NULL AND producto_hijo_siesa_id <> ''",
                String.class
            );
            java.util.Set<String> allIds = new java.util.HashSet<>();
            if (simpleIds != null) {
                for (String id : simpleIds) allIds.add(id.trim());
            }
            if (componentIds != null) {
                for (String id : componentIds) allIds.add(id.trim());
            }
            
            // Add default backup IDs
            allIds.addAll(java.util.Arrays.asList("8", "7309", "10", "13", "12", "26", "34", "15", "2549", "32"));
            return new java.util.ArrayList<>(allIds);
        } catch (Exception e) {
            System.err.println("Error en obtenerSiesaIdsActivos, usando respaldo: " + e.getMessage());
            return java.util.Arrays.asList("8", "7309", "10", "13", "12", "26", "34", "15", "2549", "32");
        }
    }

	public List<OpDoctoDTO> findByRangoFechas(LocalDate fechaInicio, LocalDate fechaFin) {
        List<String> siesaIds = obtenerSiesaIdsActivos();
        
        StringBuilder inClause = new StringBuilder();
        for (int i = 0; i < siesaIds.size(); i++) {
            if (i > 0) inClause.append(",");
            inClause.append("?");
        }

		String sql = """
				SELECT
				    'OP - ' + CONVERT(VARCHAR(10), CAST(mov.f470_id_fecha AS DATE), 23) AS OP,
                    FORMAT(mov.f470_id_fecha, 'yyyyMM') + RIGHT('000' + CAST(DENSE_RANK() OVER (PARTITION BY FORMAT(mov.f470_id_fecha, 'yyyyMM') ORDER BY CAST(mov.f470_id_fecha AS DATE)) AS VARCHAR(10)), 3) AS id_orden,
				    itm.f120_id AS item,
				    itm.f120_descripcion,
				    CAST(mov.f470_id_fecha AS DATE) AS fecha,

				    ABS(SUM(
				        CASE WHEN f470_ind_naturaleza = 1 THEN f470_cant_base ELSE 0 END -
				        CASE WHEN f470_ind_naturaleza = 2 THEN f470_cant_base ELSE 0 END
				    )) AS cantidad_consumida,

				    ISNULL(costos.total_purificacion_glicerina, 0) as total_purificacion_glicerina,
				    ISNULL(costos.total_mano_obra, 0) as total_mano_obra,
				    ISNULL(costos.total_otros_costos, 0) as total_otros_costos

				FROM  [t124_mc_items_referencias]
				LEFT JOIN  [t120_mc_items] itm
				    ON itm.f120_rowid = f124_rowid_item
				INNER JOIN  [t121_mc_items_extensiones]
				    ON f121_rowid_item = itm.f120_rowid
				INNER JOIN  [t470_cm_movto_invent] mov
				    ON mov.f470_rowid_item_ext = f121_rowid
				INNER JOIN  [t350_co_docto_contable] doc
				    ON doc.f350_rowid = mov.f470_rowid_docto
				INNER JOIN  [t150_mc_bodegas] bod
				    ON bod.f150_rowid = mov.f470_rowid_bodega

				LEFT JOIN (
				    SELECT
				        CAST(t.f880_id_fecha AS DATE) AS f_costo,
				        SUM(CASE
				            WHEN t865.f865_descripcion_operacion = 'PURIFICACION GLICERINA'
				            THEN c.f881_costo_este_nivel_total
				            ELSE 0
				        END) AS total_purificacion_glicerina,
				        SUM(CASE
				            WHEN t804.f804_descripcion IN ('MANO DE OBRA DIRECTA', 'FACTOR PRESTACIONAL DE MOD')
				                 AND t865.f865_descripcion_operacion <> 'PURIFICACION GLICERINA'
				            THEN c.f881_costo_este_nivel_total
				            ELSE 0
				        END) AS total_mano_obra,
				        SUM(CASE
				            WHEN NOT (
				                t865.f865_descripcion_operacion = 'PURIFICACION GLICERINA'
				                OR t804.f804_descripcion IN ('MANO DE OBRA DIRECTA', 'FACTOR PRESTACIONAL DE MOD')
				            )
				            THEN c.f881_costo_este_nivel_total
				            ELSE 0
				        END) AS total_otros_costos
				    FROM t881_mf_movto_tep_costo c
				    INNER JOIN t880_mf_movto_tep t
				        ON t.f880_rowid = c.f881_rowid_movto_tep
				    INNER JOIN t865_mf_op_operaciones t865
				        ON t865.f865_rowid = t.f880_rowid_op_operaciones
				    INNER JOIN t804_mf_segmentos_costos t804
				        ON t804.f804_id = c.f881_id_segmento_costo
				    GROUP BY CAST(t.f880_id_fecha AS DATE)
				) costos ON costos.f_costo = CAST(mov.f470_id_fecha AS DATE)

				WHERE
				    mov.f470_id_fecha >= ?
				    AND mov.f470_id_fecha <= ?
				    AND itm.f120_id_cia = 2
				    AND doc.f350_ind_estado = 1
				    AND itm.f120_id IN (%s)
				    AND doc.f350_id_tipo_docto IN ('TEP','EI','SDI','EDP')
				    AND NOT (itm.f120_id = '34' AND doc.f350_id_tipo_docto = 'EDP')

				GROUP BY
				    itm.f120_id,
				    itm.f120_descripcion,
				    CAST(mov.f470_id_fecha AS DATE),
				    FORMAT(mov.f470_id_fecha, 'yyyyMM'),
				    costos.total_purificacion_glicerina,
				    costos.total_mano_obra,
				    costos.total_otros_costos

				ORDER BY
				    fecha DESC,
				    itm.f120_id,
				    itm.f120_descripcion;
				""";

        String formattedSql = String.format(sql, inClause.toString());

        Object[] params = new Object[2 + siesaIds.size()];
        params[0] = java.sql.Timestamp.valueOf(fechaInicio.atStartOfDay());
        params[1] = java.sql.Timestamp.valueOf(fechaFin.atTime(23, 59, 59));
        for (int i = 0; i < siesaIds.size(); i++) {
            params[2 + i] = siesaIds.get(i);
        }

        try {
            List<OpDoctoDTO> docs = jdbcTemplate.query(formattedSql, rowMapper, params);

            // Cruzar con log de envíos
            List<java.util.Map<String, Object>> logs = appJdbcTemplate.queryForList(
                "SELECT fecha_inicio, fecha_fin FROM log_envio_reportes");

            for (OpDoctoDTO d : docs) {
                boolean enviado = false;
                if (d.getFecha() != null) {
                    for (java.util.Map<String, Object> log : logs) {
                        LocalDate inicio = ((java.sql.Date) log.get("fecha_inicio")).toLocalDate();
                        LocalDate fin    = ((java.sql.Date) log.get("fecha_fin")).toLocalDate();
                        if (!d.getFecha().isBefore(inicio) && d.getFecha().isBefore(fin)) {
                            enviado = true;
                            break;
                        }
                    }
                }
                d.setStatusEnvio(enviado ? "Enviado" : "Pendiente");
            }
            return docs;
        } catch (Exception e) {
            System.err.println("Error en findByRangoFechas: " + e.getMessage());
            e.printStackTrace();
            return new java.util.ArrayList<>();
        }
	}


    public boolean existeFechaCumplidaAyer() {
        LocalDate ayer = LocalDate.now().minusDays(1);
        String sql = """
            SELECT COUNT(*) FROM t850_mf_op_docto
            WHERE  f850_fecha_cumplida = ?
            """;
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, ayer);
        return count != null && count > 0;
    }
}