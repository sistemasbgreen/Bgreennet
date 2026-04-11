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
        
        return d;
    };

    public List<OpDoctoDTO> findAll() {
        String sql = """
            SELECT 
                'OP - ' + CONVERT(VARCHAR(10), CAST(mov.f470_id_fecha AS DATE), 23) AS OP,
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
                    CAST(mfop.f867_ts AS DATE) AS f_costo,
                    SUM(CASE 
                        WHEN mfo.f865_descripcion_operacion = 'PURIFICACION GLICERINA' 
                        THEN mfop.f867_costo_este_nivel_acum 
                        ELSE 0 
                    END) AS total_purificacion_glicerina,
                    SUM(CASE 
                        WHEN mf.f804_descripcion IN ('MANO DE OBRA DIRECTA', 'FACTOR PRESTACIONAL DE MOD')
                             AND mfo.f865_descripcion_operacion <> 'PURIFICACION GLICERINA'
                        THEN mfop.f867_costo_este_nivel_acum 
                        ELSE 0 
                    END) AS total_mano_obra,
                    SUM(CASE 
                        WHEN NOT (
                            mfo.f865_descripcion_operacion = 'PURIFICACION GLICERINA'
                            OR mf.f804_descripcion IN ('MANO DE OBRA DIRECTA', 'FACTOR PRESTACIONAL DE MOD')
                        )
                        THEN mfop.f867_costo_este_nivel_acum 
                        ELSE 0 
                    END) AS total_otros_costos
                FROM t867_mf_op_operaciones_costos mfop
                INNER JOIN t804_mf_segmentos_costos mf
                    ON mf.f804_id = mfop.f867_id_segmento_costo
                INNER JOIN t865_mf_op_operaciones mfo
                    ON mfo.f865_rowid = mfop.f867_rowid_op_operacion
                GROUP BY CAST(mfop.f867_ts AS DATE)
            ) costos ON costos.f_costo = CAST(mov.f470_id_fecha AS DATE)
            
            WHERE 
                mov.f470_id_fecha >= '2026-03-5'
                AND mov.f470_id_fecha < '2026-04-10'
                AND f120_id_cia = 2
                AND f350_ind_estado = 1
                AND f120_id IN ('8','7309','10','13','12','26','34','15','2549','32')
                AND f350_id_tipo_docto IN ('TEP','EI','EDP')
                AND NOT (f120_id = '34' AND f350_id_tipo_docto = 'EDP')
                AND f350_rowid NOT IN ('695891','696066','692530')
            
            GROUP BY 
                f120_id,
                f120_descripcion,
                CAST(mov.f470_id_fecha AS DATE),
                costos.total_purificacion_glicerina,
                costos.total_mano_obra,
                costos.total_otros_costos
            
            ORDER BY 
                f120_id,
                f120_descripcion,
                fecha;
            """;
        return jdbcTemplate.query(sql, rowMapper);
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