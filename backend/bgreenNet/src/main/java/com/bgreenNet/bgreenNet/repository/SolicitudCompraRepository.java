package com.bgreenNet.bgreenNet.repository;

import com.bgreenNet.bgreenNet.dto.SolicitudCompraDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Repository
public class SolicitudCompraRepository {

    @Autowired
    @Qualifier("siesaJdbcTemplate")
    private JdbcTemplate siesaJdbcTemplate;

    private final RowMapper<SolicitudCompraDTO> rowMapper = new RowMapper<SolicitudCompraDTO>() {
        @Override
        public SolicitudCompraDTO mapRow(ResultSet rs, int rowNum) throws SQLException {
            SolicitudCompraDTO dto = new SolicitudCompraDTO();

            Timestamp ts = rs.getTimestamp("f420_ts");
            if (ts != null) {
                dto.setTs(ts.toLocalDateTime());
            }

            long rowid = rs.getLong("f420_rowid");
            if (!rs.wasNull()) {
                dto.setRowid(rowid);
            }

            dto.setIdTipoDocto(rs.getString("f420_id_tipo_docto") != null ? rs.getString("f420_id_tipo_docto").trim() : null);

            long consecDocto = rs.getLong("f420_consec_docto");
            if (!rs.wasNull()) {
                dto.setConsecDocto(consecDocto);
            }

            java.sql.Date fecha = rs.getDate("f420_fecha");
            if (fecha != null) {
                dto.setFecha(fecha.toLocalDate());
            }

            dto.setIdConcepto(rs.getString("f420_id_concepto") != null ? rs.getString("f420_id_concepto").trim() : null);

            int indEstado = rs.getInt("f420_ind_estado");
            if (!rs.wasNull()) {
                dto.setIndEstado(indEstado);
            }

            long rowidTercero = rs.getLong("f420_rowid_tercero_sol_comp");
            if (!rs.wasNull()) {
                dto.setRowidTerceroSolComp(rowidTercero);
            }

            Timestamp tsCreacion = rs.getTimestamp("f420_fecha_ts_creacion");
            if (tsCreacion != null) {
                dto.setFechaTsCreacion(tsCreacion.toLocalDateTime());
            }

            Timestamp tsAnulacion = rs.getTimestamp("f420_fecha_ts_anulacion");
            if (tsAnulacion != null) {
                dto.setFechaTsAnulacion(tsAnulacion.toLocalDateTime());
            }

            Timestamp tsAprobacion = rs.getTimestamp("f420_fecha_ts_aprobacion");
            if (tsAprobacion != null) {
                dto.setFechaTsAprobacion(tsAprobacion.toLocalDateTime());
            }

            Timestamp tsCumplido = rs.getTimestamp("f420_fecha_ts_cumplido");
            if (tsCumplido != null) {
                dto.setFechaTsCumplido(tsCumplido.toLocalDateTime());
            }

            dto.setUsuarioCreacion(rs.getString("f420_usuario_creacion") != null ? rs.getString("f420_usuario_creacion").trim() : null);
            dto.setUsuarioAprobacion(rs.getString("f420_usuario_aprobacion") != null ? rs.getString("f420_usuario_aprobacion").trim() : null);
            dto.setUsuarioCumplido(rs.getString("f420_usuario_cumplido") != null ? rs.getString("f420_usuario_cumplido").trim() : null);
            dto.setNotas(rs.getString("f420_notas") != null ? rs.getString("f420_notas").trim() : null);
            dto.setUsuarioAprobacionMonto(rs.getString("f420_usuario_aprobacion_monto") != null ? rs.getString("f420_usuario_aprobacion_monto").trim() : null);

            return dto;
        }
    };

    /**
     * Consulta principal solicitada:
     * SELECT f420_ts, f420_rowid, f420_id_tipo_docto, f420_consec_docto, f420_fecha, f420_id_concepto,
     *        f420_ind_estado, f420_rowid_tercero_sol_comp, f420_fecha_ts_creacion, f420_fecha_ts_anulacion,
     *        f420_fecha_ts_aprobacion, f420_fecha_ts_cumplido, f420_usuario_creacion, f420_usuario_aprobacion,
     *        f420_usuario_cumplido, f420_notas, f420_usuario_aprobacion_monto
     * FROM t420_cm_oc_docto
     * WHERE f420_id_tipo_docto IN ('SS', 'SC')
     *   AND f420_id_cia = 2
     * ORDER BY f420_ts DESC;
     */
    public List<SolicitudCompraDTO> findAll() {
        String sql = "SELECT f420_ts, f420_rowid, f420_id_tipo_docto, f420_consec_docto, f420_fecha, f420_id_concepto, "
                   + "       f420_ind_estado, f420_rowid_tercero_sol_comp, f420_fecha_ts_creacion, f420_fecha_ts_anulacion, "
                   + "       f420_fecha_ts_aprobacion, f420_fecha_ts_cumplido, f420_usuario_creacion, f420_usuario_aprobacion, "
                   + "       f420_usuario_cumplido, f420_notas, f420_usuario_aprobacion_monto "
                   + "FROM t420_cm_oc_docto "
                   + "WHERE f420_id_tipo_docto IN ('SS', 'SC') "
                   + "  AND f420_id_cia = 2 "
                   + "ORDER BY f420_ts DESC";

        return siesaJdbcTemplate.query(sql, rowMapper);
    }

    /**
     * Consulta con soporte para filtros dinámicos (tipo docto, estado, fechas).
     */
    public List<SolicitudCompraDTO> findWithFilters(String tipoDocto, Integer estado, LocalDate fechaInicio, LocalDate fechaFin) {
        StringBuilder sql = new StringBuilder(
            "SELECT f420_ts, f420_rowid, f420_id_tipo_docto, f420_consec_docto, f420_fecha, f420_id_concepto, "
            + "       f420_ind_estado, f420_rowid_tercero_sol_comp, f420_fecha_ts_creacion, f420_fecha_ts_anulacion, "
            + "       f420_fecha_ts_aprobacion, f420_fecha_ts_cumplido, f420_usuario_creacion, f420_usuario_aprobacion, "
            + "       f420_usuario_cumplido, f420_notas, f420_usuario_aprobacion_monto "
            + "FROM t420_cm_oc_docto "
            + "WHERE f420_id_cia = 2 "
        );

        List<Object> params = new ArrayList<>();

        if (tipoDocto != null && !tipoDocto.trim().isEmpty()) {
            sql.append(" AND f420_id_tipo_docto = ? ");
            params.add(tipoDocto.trim().toUpperCase());
        } else {
            sql.append(" AND f420_id_tipo_docto IN ('SS', 'SC') ");
        }

        if (estado != null) {
            sql.append(" AND f420_ind_estado = ? ");
            params.add(estado);
        }

        if (fechaInicio != null) {
            sql.append(" AND f420_fecha >= ? ");
            params.add(java.sql.Date.valueOf(fechaInicio));
        }

        if (fechaFin != null) {
            sql.append(" AND f420_fecha <= ? ");
            params.add(java.sql.Date.valueOf(fechaFin));
        }

        sql.append(" ORDER BY f420_ts DESC");

        return siesaJdbcTemplate.query(sql.toString(), rowMapper, params.toArray());
    }
}
