package com.bgreenNet.bgreenNet.repository;

import com.bgreenNet.bgreenNet.dto.ItemExistenciaDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Repository
public class ItemRepository {

    private final JdbcTemplate siesaJdbcTemplate;

    public ItemRepository(@Qualifier("siesaJdbcTemplate") JdbcTemplate siesaJdbcTemplate) {
        this.siesaJdbcTemplate = siesaJdbcTemplate;
    }

    private final RowMapper<ItemExistenciaDTO> itemRowMapper = (rs, rowNum) -> {
        ItemExistenciaDTO dto = new ItemExistenciaDTO();
        dto.setCia(2); // Consulta fija para cía 2
        dto.setItemId(rs.getString("f120_id"));
        dto.setDescripcion(rs.getString("f120_descripcion"));
        dto.setDescripcionCorta(rs.getString("f120_descripcion_corta"));
        dto.setUnidadInventario(rs.getString("f120_id_unidad_inventario"));
        dto.setTipoInvServ(rs.getString("f120_id_tipo_inv_serv"));
        dto.setDescTipoInvServ(rs.getString("f149_descripcion"));
        dto.setBodega(rs.getString("f150_id"));
        dto.setNombreBodega(rs.getString("f150_descripcion"));

        double stock = rs.getDouble("f400_cant_existencia_1");
        double costo = rs.getDouble("f400_costo_prom_tot");
        dto.setStockActual(stock);
        dto.setCostoPromedio(costo);
        dto.setValorTotalInventario(stock * costo);
        return dto;
    };

    /**
     * Consulta de existencias y costos en bodega según la consulta de Siesa solicitada:
     * SELECT
     *   s.[f400_cant_existencia_1],
     *   s.[f400_costo_prom_tot],
     *   i.[f120_id],
     *   i.[f120_descripcion],
     *   i.[f120_id_unidad_inventario],
     *   i.[f120_id_tipo_inv_serv],
     *   i.[f120_descripcion_corta],
     *   b.[f150_id],
     *   b.[f150_descripcion],
     *   f.[f149_descripcion]
     * FROM [dbo].[t400_cm_existencia] AS s
     * INNER JOIN [dbo].[t121_mc_items_extensiones] AS ie
     *   ON s.[f400_rowid_item_ext] = ie.[f121_rowid]
     * INNER JOIN [dbo].[t150_mc_bodegas] AS b
     *   ON s.[f400_rowid_bodega] = b.[f150_rowid]
     * INNER JOIN [dbo].[t120_mc_items] AS i
     *   ON ie.[f121_rowid_item] = i.[f120_rowid]
     * INNER JOIN [dbo].[t149_mc_tipo_inv_serv] AS f
     *   ON i.[f120_id_tipo_inv_serv] = f.[f149_id]
     * WHERE s.f400_id_cia = 2
     */
    public List<ItemExistenciaDTO> findExistencias(String bodega, String busqueda) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT ")
           .append("  s.[f400_cant_existencia_1], ")
           .append("  s.[f400_costo_prom_tot], ")
           .append("  i.[f120_id], ")
           .append("  i.[f120_descripcion], ")
           .append("  i.[f120_id_unidad_inventario], ")
           .append("  i.[f120_id_tipo_inv_serv], ")
           .append("  i.[f120_descripcion_corta], ")
           .append("  b.[f150_id], ")
           .append("  b.[f150_descripcion], ")
           .append("  f.[f149_descripcion] ")
           .append("FROM [dbo].[t400_cm_existencia] AS s ")
           .append("INNER JOIN [dbo].[t121_mc_items_extensiones] AS ie ")
           .append("  ON s.[f400_rowid_item_ext] = ie.[f121_rowid] ")
           .append("INNER JOIN [dbo].[t150_mc_bodegas] AS b ")
           .append("  ON s.[f400_rowid_bodega] = b.[f150_rowid] ")
           .append("INNER JOIN [dbo].[t120_mc_items] AS i ")
           .append("  ON ie.[f121_rowid_item] = i.[f120_rowid] ")
           .append("INNER JOIN [dbo].[t149_mc_tipo_inv_serv] AS f ")
           .append("  ON i.[f120_id_tipo_inv_serv] = f.[f149_id] ")
           .append("WHERE s.f400_id_cia = 2 ");

        List<Object> params = new ArrayList<>();

        // Si se especifican una o más bodegas (separadas por coma) y no es "TODAS"
        if (bodega != null && !bodega.trim().isEmpty() && !bodega.equalsIgnoreCase("TODAS")) {
            String[] parts = bodega.split(",");
            List<String> bodegasClean = Arrays.stream(parts)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty() && !s.equalsIgnoreCase("TODAS"))
                    .toList();

            if (!bodegasClean.isEmpty()) {
                String placeholders = String.join(",", Collections.nCopies(bodegasClean.size(), "?"));
                sql.append("AND b.[f150_id] IN (").append(placeholders).append(") ");
                params.addAll(bodegasClean);
            }
        }

        if (busqueda != null && !busqueda.trim().isEmpty()) {
            sql.append("AND (i.[f120_id] LIKE ? OR i.[f120_descripcion] LIKE ? OR i.[f120_descripcion_corta] LIKE ? OR b.[f150_descripcion] LIKE ? OR b.[f150_id] LIKE ? OR f.[f149_descripcion] LIKE ?) ");
            String term = "%" + busqueda.trim() + "%";
            params.add(term);
            params.add(term);
            params.add(term);
            params.add(term);
            params.add(term);
            params.add(term);
        }

        sql.append("ORDER BY i.[f120_id] ASC, b.[f150_id] ASC");

        return siesaJdbcTemplate.query(sql.toString(), itemRowMapper, params.toArray());
    }

    /**
     * Obtiene la lista de bodegas disponibles en Siesa para la compañía 2
     */
    public List<Map<String, Object>> findBodegas() {
        String sql = "SELECT DISTINCT b.f150_id AS id, b.f150_descripcion AS descripcion " +
                     "FROM dbo.t400_cm_existencia s " +
                     "INNER JOIN dbo.t150_mc_bodegas b ON s.f400_rowid_bodega = b.f150_rowid " +
                     "WHERE s.f400_id_cia = 2 AND b.f150_id IS NOT NULL " +
                     "ORDER BY b.f150_id ASC";
        return siesaJdbcTemplate.queryForList(sql);
    }
}
