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
 * Repositorio para consultar requisiciones internas, movimientos de inventario,
 * documentos contables, tercero solicitante y centros de costo en Siesa
 * para el módulo de firmas digitales.
 */
@Repository
public class FirmaDigitalRepository {

    private static final String SQL_REQUISICIONES_BASE = """
            SELECT TOP 100
                t470.[f470_id_ubicacion_aux],
                t470.[f470_costo_prom_tot],
                t441.[f441_fecha_entrega],
                t441.[f441_ts],
                t441.[f441_id_concepto],
                t441.[f441_id_motivo],
                t441.[f441_id_unidad_medida],
                t441.[f441_cant1_consumida],
                f.[f150_id],
                g.[f010_razon_social],
                g.[f010_nit],
                t440.[f440_id_tipo_docto],
                t440.[f440_consec_docto],
                t440.[f440_rowid_tercero],
                t440.[f440_referencia],
                t440.[f440_notas],
                t440.[f440_usuario_creacion],
                t440.[f440_usuario_aprobacion],
                t440.[f440_usuario_cumplido],
                t440.[f440_ind_estado],
                t440.[f440_rowid_tercero_sol],
                t440.[f440_usuario_parcial],
                t120.[f120_id],
                t120.[f120_descripcion],
                h.[f350_id_tipo_docto],
                h.[f350_consec_docto],
                h.[f350_fecha],
                i.[f200_razon_social],
                j.[f284_id]
            FROM [dbo].[t470_cm_movto_invent] AS t470
            INNER JOIN [dbo].[t441_movto_req_int] AS t441
                ON t470.[f470_rowid_movto_req_int] = t441.[f441_rowid]
            INNER JOIN [dbo].[t121_mc_items_extensiones] AS t121
                ON t470.[f470_rowid_item_ext] = t121.[f121_rowid]
            INNER JOIN [dbo].[t150_mc_bodegas] AS f
                ON t470.[f470_rowid_bodega] = f.[f150_rowid]
            INNER JOIN [dbo].[t010_mm_companias] AS g
                ON t470.[f470_id_cia] = g.[f010_id]
            INNER JOIN [dbo].[t350_co_docto_contable] AS h
                ON t470.[f470_rowid_docto] = h.[f350_rowid]
            INNER JOIN [dbo].[t440_docto_req_int] AS t440
                ON t441.[f441_rowid_docto_req_int] = t440.[f440_rowid]
            INNER JOIN [dbo].[t120_mc_items] AS t120
                ON t121.[f121_rowid_item] = t120.[f120_rowid]
            LEFT JOIN [dbo].[t200_mm_terceros] AS i
                ON t440.[f440_rowid_tercero_sol] = i.[f200_rowid]
            INNER JOIN [dbo].[t284_co_ccosto] AS j
                ON t470.[f470_rowid_ccosto_movto] = j.[f284_rowid]
            WHERE t441.[f441_id_cia] = ?
              AND t440.[f440_id_tipo_docto] = ?
            """;

    private final JdbcTemplate siesaJdbcTemplate;

    public FirmaDigitalRepository(@Qualifier("siesaJdbcTemplate") JdbcTemplate siesaJdbcTemplate) {
        this.siesaJdbcTemplate = siesaJdbcTemplate;
    }

    private final RowMapper<FirmaDigitalRequisicionDTO> rowMapper = (rs, rowNum) -> {
        FirmaDigitalRequisicionDTO dto = new FirmaDigitalRequisicionDTO();
        dto.setF470IdUbicacionAux(getTrimmedString(rs, "f470_id_ubicacion_aux"));
        dto.setF470CostoPromTot(rs.getBigDecimal("f470_costo_prom_tot"));
        dto.setF441FechaEntrega(getLocalDateTime(rs, "f441_fecha_entrega"));
        dto.setF441Ts(getLocalDateTime(rs, "f441_ts"));
        dto.setF441IdConcepto(getInt(rs, "f441_id_concepto"));
        dto.setF441IdMotivo(getTrimmedString(rs, "f441_id_motivo"));
        dto.setF441IdUnidadMedida(getTrimmedString(rs, "f441_id_unidad_medida"));
        dto.setF441Cant1Consumida(rs.getBigDecimal("f441_cant1_consumida"));
        dto.setF150Id(getTrimmedString(rs, "f150_id"));
        dto.setF010RazonSocial(getTrimmedString(rs, "f010_razon_social"));
        dto.setF010Nit(getTrimmedString(rs, "f010_nit"));
        dto.setF440IdTipoDocto(getTrimmedString(rs, "f440_id_tipo_docto"));
        dto.setF440ConsecDocto(getInt(rs, "f440_consec_docto"));
        dto.setF440RowidTercero(getLong(rs, "f440_rowid_tercero"));
        dto.setF440Referencia(getTrimmedString(rs, "f440_referencia"));
        dto.setF440Notas(getTrimmedString(rs, "f440_notas"));
        dto.setF440UsuarioCreacion(getTrimmedString(rs, "f440_usuario_creacion"));
        dto.setF440UsuarioAprobacion(getTrimmedString(rs, "f440_usuario_aprobacion"));
        dto.setF440UsuarioCumplido(getTrimmedString(rs, "f440_usuario_cumplido"));
        dto.setF440IndEstado(getInt(rs, "f440_ind_estado"));
        dto.setF440RowidTerceroSol(getLong(rs, "f440_rowid_tercero_sol"));
        dto.setF440UsuarioParcial(getTrimmedString(rs, "f440_usuario_parcial"));
        dto.setF120Id(getTrimmedString(rs, "f120_id"));
        dto.setF120Descripcion(getTrimmedString(rs, "f120_descripcion"));
        dto.setF350IdTipoDocto(getTrimmedString(rs, "f350_id_tipo_docto"));
        dto.setF350ConsecDocto(getInt(rs, "f350_consec_docto"));
        dto.setF350Fecha(getLocalDateTime(rs, "f350_fecha"));
        dto.setF200RazonSocial(getTrimmedString(rs, "f200_razon_social"));
        dto.setF284Id(getTrimmedString(rs, "f284_id"));
        return dto;
    };

    /**
     * Consulta los movimientos de requisiciones internas en Siesa
     * filtrando opcionalmente por consecutivo de documento y/o rango de fechas.
     */
    public List<FirmaDigitalRequisicionDTO> consultarRequisiciones(
            LocalDate fechaInicio,
            LocalDate fechaFin,
            Integer consecDocto,
            Integer idCia,
            String tipoDocto) {
        StringBuilder sql = new StringBuilder(SQL_REQUISICIONES_BASE);
        List<Object> params = new ArrayList<>();
        params.add(idCia);
        params.add(tipoDocto);

        if (consecDocto != null) {
            sql.append("  AND t440.[f440_consec_docto] = ?\n");
            params.add(consecDocto);
        }

        if (fechaInicio != null && fechaFin != null) {
            sql.append("  AND t441.[f441_ts] >= ?\n");
            sql.append("  AND t441.[f441_ts] < ?\n");
            params.add(Timestamp.valueOf(fechaInicio.atStartOfDay()));
            params.add(Timestamp.valueOf(fechaFin.plusDays(1).atStartOfDay()));
        }

        sql.append("ORDER BY t441.[f441_ts] DESC");
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
