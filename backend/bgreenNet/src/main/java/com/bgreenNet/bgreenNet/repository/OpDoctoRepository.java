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
        d.setIdTipoDocto(rs.getString("f850_id_tipo_docto"));
        d.setConsecDocto(rs.getLong("f850_consec_docto"));
        d.setIndEstado(rs.getString("f850_ind_estado"));

        var tsCreacion = rs.getTimestamp("f850_fecha_ts_creacion");
        if (tsCreacion != null) d.setFechaTsCreacion(tsCreacion.toLocalDateTime());

        var tsAprobacion = rs.getTimestamp("f850_fecha_ts_aprobacion");
        if (tsAprobacion != null) d.setFechaTsAprobacion(tsAprobacion.toLocalDateTime());

        var tsAnulacion = rs.getTimestamp("f850_fecha_ts_anulacion");
        if (tsAnulacion != null) d.setFechaTsAnulacion(tsAnulacion.toLocalDateTime());

        var fechaCumplida = rs.getDate("f850_fecha_cumplida");
        if (fechaCumplida != null) d.setFechaCumplida(fechaCumplida.toLocalDate());

        d.setNotas(rs.getString("f850_notas"));
        d.setUsuarioCumplido(rs.getString("f850_usuario_cumplido"));
        return d;
    };

    public List<OpDoctoDTO> findAll() {
        String sql = """
            SELECT f850_id_tipo_docto, f850_consec_docto, f850_ind_estado,
                   f850_fecha_ts_creacion, f850_fecha_ts_aprobacion,
                   f850_fecha_ts_anulacion, f850_fecha_cumplida,
                   f850_notas, f850_usuario_cumplido
            FROM   t850_mf_op_docto
            ORDER  BY f850_fecha_ts_creacion DESC
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