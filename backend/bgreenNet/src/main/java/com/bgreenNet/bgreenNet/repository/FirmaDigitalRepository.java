package com.bgreenNet.bgreenNet.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import com.bgreenNet.bgreenNet.dto.FirmaDigitalRequisicionDTO;

/**
 * Repositorio para consultar requisiciones internas y movimientos de inventario
 * en la base de datos Siesa para el módulo de firmas digitales.
 */
@Repository
public class FirmaDigitalRepository {

    private static final String SQL_REQUISICIONES_BASE = """
            SELECT
                t441.f441_fecha_entrega,
                t441.f441_ts,
                t441.f441_rowid,
                t441.f441_rowid_docto_req_int,
                t441.f441_id_cia,
                t441.f441_rowid_item_ext,
                t441.f441_rowid_bodega,
                t441.f441_id_concepto,
                t441.f441_id_motivo,
                t441.f441_id_unidad_medida,
                t441.f441_factor,
                t441.f441_cant1_consumida,
                t440.f440_id_tipo_docto,
                t440.f440_consec_docto,
                t440.f440_rowid_tercero,
                t440.f440_referencia,
                t440.f440_notas,
                t440.f440_usuario_creacion,
                t440.f440_usuario_aprobacion,
                t440.f440_usuario_cumplido,
                t470.f470_rowid_item_ext,
                t470.f470_id_ubicacion_aux,
                t470.f470_id_periodo,
                t470.f470_rowid_movto_req_int,
                t120.f120_descripcion,
                t120.f120_descripcion_corta,
                t120.f120_id
            FROM t441_movto_req_int t441
            INNER JOIN t440_docto_req_int t440
                ON t441.f441_rowid_docto_req_int = t440.f440_rowid
            INNER JOIN t470_cm_movto_invent t470
                ON t441.f441_rowid = t470.f470_rowid_movto_req_int
            INNER JOIN t121_mc_items_extensiones t121
                ON t470.f470_rowid_item_ext = t121.f121_rowid
            INNER JOIN t120_mc_items t120
                ON t121.f121_rowid_item = t120.f120_rowid
            WHERE t441.f441_ts >= ?
              AND t441.f441_ts < ?
              AND t441.f441_id_cia = ?
              AND t440.f440_id_tipo_docto = ?
            """;

    private final JdbcTemplate siesaJdbcTemplate;

    public FirmaDigitalRepository(@Qualifier("siesaJdbcTemplate") JdbcTemplate siesaJdbcTemplate) {
        this.siesaJdbcTemplate = siesaJdbcTemplate;
    }

    private final RowMapper<FirmaDigitalRequisicionDTO> rowMapper = (rs, rowNum) -> {
        FirmaDigitalRequisicionDTO dto = new FirmaDigitalRequisicionDTO();
        dto.setF441FechaEntrega(getLocalDateTime(rs, "f441_fecha_entrega"));
        dto.setF441Ts(getLocalDateTime(rs, "f441_ts"));
        dto.setF441Rowid(getLong(rs, "f441_rowid"));
        dto.setF441RowidDoctoReqInt(getLong(rs, "f441_rowid_docto_req_int"));
        dto.setF441IdCia(getInt(rs, "f441_id_cia"));
        dto.setF441RowidItemExt(getLong(rs, "f441_rowid_item_ext"));
        dto.setF441RowidBodega(getLong(rs, "f441_rowid_bodega"));
        dto.setF441IdConcepto(getInt(rs, "f441_id_concepto"));
        dto.setF441IdMotivo(getTrimmedString(rs, "f441_id_motivo"));
        dto.setF441IdUnidadMedida(getTrimmedString(rs, "f441_id_unidad_medida"));
        dto.setF441Factor(rs.getBigDecimal("f441_factor"));
        dto.setF441Cant1Consumida(rs.getBigDecimal("f441_cant1_consumida"));
        dto.setF440IdTipoDocto(getTrimmedString(rs, "f440_id_tipo_docto"));
        dto.setF440ConsecDocto(getInt(rs, "f440_consec_docto"));
        dto.setF440RowidTercero(getLong(rs, "f440_rowid_tercero"));
        dto.setF440Referencia(getTrimmedString(rs, "f440_referencia"));
        dto.setF440Notas(getTrimmedString(rs, "f440_notas"));
        dto.setF440UsuarioCreacion(getTrimmedString(rs, "f440_usuario_creacion"));
        dto.setF440UsuarioAprobacion(getTrimmedString(rs, "f440_usuario_aprobacion"));
        dto.setF440UsuarioCumplido(getTrimmedString(rs, "f440_usuario_cumplido"));
        dto.setF470RowidItemExt(getLong(rs, "f470_rowid_item_ext"));
        dto.setF470IdUbicacionAux(getTrimmedString(rs, "f470_id_ubicacion_aux"));
        dto.setF470IdPeriodo(getTrimmedString(rs, "f470_id_periodo"));
        dto.setF470RowidMovtoReqInt(getLong(rs, "f470_rowid_movto_req_int"));
        dto.setF120Descripcion(getTrimmedString(rs, "f120_descripcion"));
        dto.setF120DescripcionCorta(getTrimmedString(rs, "f120_descripcion_corta"));
        dto.setF120Id(getTrimmedString(rs, "f120_id"));
        return dto;
    };

    /**
     * Consulta los movimientos de requisiciones internas en Siesa por rango de fechas
     * y opcionalmente por consecutivo de documento.
     */
    public List<FirmaDigitalRequisicionDTO> consultarRequisicionesPorFecha(
            LocalDate fechaInicio,
            LocalDate fechaFin,
            Integer consecDocto,
            Integer idCia,
            String tipoDocto) {
        StringBuilder sql = new StringBuilder(SQL_REQUISICIONES_BASE);
        List<Object> params = new ArrayList<>();
        params.add(Timestamp.valueOf(fechaInicio.atStartOfDay()));
        params.add(Timestamp.valueOf(fechaFin.plusDays(1).atStartOfDay()));
        params.add(idCia);
        params.add(tipoDocto);

        if (consecDocto != null) {
            sql.append("  AND t440.f440_consec_docto = ?\n");
            params.add(consecDocto);
        }

        sql.append("ORDER BY t441.f441_ts DESC");
        return siesaJdbcTemplate.query(sql.toString(), rowMapper, params.toArray());
    }

    private static LocalDateTime getLocalDateTime(ResultSet rs, String column) throws SQLException {
        Timestamp ts = rs.getTimestamp(column);
        return ts != null ? ts.toLocalDateTime() : null;
    }

    private static Long getLong(ResultSet rs, String column) throws SQLException {
        Object val = rs.getObject(column);
        return val instanceof Number n ? n.longValue() : null;
    }

    private static Integer getInt(ResultSet rs, String column) throws SQLException {
        Object val = rs.getObject(column);
        return val instanceof Number n ? n.intValue() : null;
    }

    private static String getTrimmedString(ResultSet rs, String column) throws SQLException {
        String val = rs.getString(column);
        return val != null ? val.trim() : null;
    }
}
