package com.bgreenNet.bgreenNet.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import com.bgreenNet.bgreenNet.dto.InventarioSvisionDTO;

/**
 * Repositorio para consultar el inventario en Siesa para la integración con Svision.
 */
@Repository
public class InventarioSvisionRepository {

    private static final String SQL_INVENTARIO_SVISION_BASE = """
            SELECT
                s.[f400_cant_existencia_1] AS CantidadExistente,
                s.[f400_costo_prom_tot] AS CostoPromedio,
                i.[f120_id] AS Items,
                i.[f120_descripcion] AS Descripcion,
                i.[f120_id_unidad_inventario] AS UND,
                i.[f120_id_tipo_inv_serv] AS TipoInventario,
                i.[f120_descripcion_corta] AS DescripcionCorta,
                b.[f150_id] AS Bodega,
                b.[f150_descripcion] AS DescripcionBodega,
                f.[f149_descripcion] AS DescripcionTipoInventario
            FROM [dbo].[t400_cm_existencia] AS s
            INNER JOIN [dbo].[t121_mc_items_extensiones] AS ie
                ON s.[f400_rowid_item_ext] = ie.[f121_rowid]
            INNER JOIN [dbo].[t150_mc_bodegas] AS b
                ON s.[f400_rowid_bodega] = b.[f150_rowid]
            INNER JOIN [dbo].[t120_mc_items] AS i
                ON ie.[f121_rowid_item] = i.[f120_rowid]
            INNER JOIN [dbo].[t149_mc_tipo_inv_serv] AS f
                ON i.[f120_id_tipo_inv_serv] = f.[f149_id]
            WHERE s.[f400_id_cia] = ?
            """;

    private final JdbcTemplate siesaJdbcTemplate;

    public InventarioSvisionRepository(@Qualifier("siesaJdbcTemplate") JdbcTemplate siesaJdbcTemplate) {
        this.siesaJdbcTemplate = siesaJdbcTemplate;
    }

    private final RowMapper<InventarioSvisionDTO> rowMapper = (rs, rowNum) -> {
        InventarioSvisionDTO dto = new InventarioSvisionDTO();
        dto.setCantidadExistente(rs.getBigDecimal("CantidadExistente"));
        dto.setCostoPromedio(rs.getBigDecimal("CostoPromedio"));
        dto.setItems(getTrimmedString(rs, "Items"));
        dto.setDescripcion(getTrimmedString(rs, "Descripcion"));
        dto.setUnd(getTrimmedString(rs, "UND"));
        dto.setTipoInventario(getTrimmedString(rs, "TipoInventario"));
        dto.setDescripcionCorta(getTrimmedString(rs, "DescripcionCorta"));
        dto.setBodega(getTrimmedString(rs, "Bodega"));
        dto.setDescripcionBodega(getTrimmedString(rs, "DescripcionBodega"));
        dto.setDescripcionTipoInventario(getTrimmedString(rs, "DescripcionTipoInventario"));
        return dto;
    };

    public List<InventarioSvisionDTO> consultarInventario(
            Integer idCia,
            String bodega,
            String tipoInventario) {
        StringBuilder sql = new StringBuilder(SQL_INVENTARIO_SVISION_BASE);
        List<Object> params = new ArrayList<>();
        params.add(idCia);

        if (bodega != null && !bodega.trim().isEmpty()) {
            sql.append("  AND b.[f150_id] = ?\n");
            params.add(bodega.trim());
        }

        if (tipoInventario != null && !tipoInventario.trim().isEmpty()) {
            sql.append("  AND i.[f120_id_tipo_inv_serv] = ?\n");
            params.add(tipoInventario.trim());
        }

        return siesaJdbcTemplate.query(sql.toString(), rowMapper, params.toArray());
    }

    private static String getTrimmedString(ResultSet rs, String column) throws SQLException {
        String val = rs.getString(column);
        return val != null ? val.trim() : null;
    }
}
