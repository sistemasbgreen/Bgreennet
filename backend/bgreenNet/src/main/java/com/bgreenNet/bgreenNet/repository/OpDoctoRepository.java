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

	public List<OpDoctoDTO> findByRangoFechas(LocalDate fechaInicio, LocalDate fechaFin) {
		String sql = """
				SELECT
				    'OP - ' + CONVERT(VARCHAR(10), CAST(mov.f470_id_fecha AS DATE), 23) AS OP,
                    FORMAT(mov.f470_id_fecha, 'yyyyMM') + RIGHT('000' + CAST(DENSE_RANK() OVER (PARTITION BY FORMAT(mov.f470_id_fecha, 'yyyyMM') ORDER BY CAST(mov.f470_id_fecha AS DATE)) AS VARCHAR(10)), 3) AS id_orden,
				    f120_id AS item,
				    f120_descripcion,
				    CAST(mov.f470_id_fecha AS DATE) AS fecha,

				    ABS(SUM(
				        CASE WHEN f470_ind_naturaleza = 1 THEN f470_cant_base ELSE 0 END -
				        CASE WHEN f470_ind_naturaleza = 2 THEN f470_cant_base ELSE 0 END
				    )) AS cantidad_consumida,

				    ISNULL(costos.total_purificacion_glicerina, 0) as total_purificacion_glicerina,
				    ISNULL(costos.total_mano_obra, 0) as total_mano_obra,
				    ISNULL(costos.total_otros_costos, 0) as total_otros_costos

				FROM  [t124_mc_items_referencias]
				LEFT JOIN  [t120_mc_items] item
				    ON f120_rowid = f124_rowid_item
				INNER JOIN  [t121_mc_items_extensiones]
				    ON f121_rowid_item = f120_rowid
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
				    AND f120_id_cia = 2
				    AND f350_ind_estado = 1
				    AND f120_id IN ('8','7309','10','13','12','26','34','15','2549','32')
				    AND f350_id_tipo_docto IN ('TEP','EI','SDI','EDP')
				    AND NOT (f120_id = '34' AND f350_id_tipo_docto = 'EDP')

				GROUP BY
				    f120_id,
				    f120_descripcion,
				    CAST(mov.f470_id_fecha AS DATE),
				    FORMAT(mov.f470_id_fecha, 'yyyyMM'),
				    costos.total_purificacion_glicerina,
				    costos.total_mano_obra,
				    costos.total_otros_costos

				ORDER BY
				    fecha DESC,
				    f120_id,
				    f120_descripcion;
				""";

		List<OpDoctoDTO> docs = jdbcTemplate.query(sql, rowMapper,
			java.sql.Timestamp.valueOf(fechaInicio.atStartOfDay()),
			java.sql.Timestamp.valueOf(fechaFin.atTime(23, 59, 59)));

		// Cruzar con log de envíos
		try {
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
		} catch (Exception e) {
			docs.forEach(d -> d.setStatusEnvio("Pendiente"));
		}

		return docs;
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