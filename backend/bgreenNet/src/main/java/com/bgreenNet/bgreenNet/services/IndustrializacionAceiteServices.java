package com.bgreenNet.bgreenNet.services;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.dto.IndustrializacionAceiteDTO;

@Service
public class IndustrializacionAceiteServices {

	

	
    private final JdbcTemplate siesaJdbcTemplate;
    
    public IndustrializacionAceiteServices(@Qualifier("siesaJdbcTemplate") JdbcTemplate siesaJdbcTemplate) {
        this.siesaJdbcTemplate = siesaJdbcTemplate;
    }
    
    public IndustrializacionAceiteDTO obtenerIndicador(Integer year) {

        String fechaInicio = year + "-01-01";
        String fechaFin = (year + 1) + "-01-01";

        String sql = """
            SELECT 
                ((SUM(mov.f470_cant_1) / 1000) / 150000) * 100 AS Resultado
            FROM  t124_mc_items_referencias
            LEFT JOIN t120_mc_items item
                ON f120_rowid = f124_rowid_item
            INNER JOIN t121_mc_items_extensiones
                ON f121_rowid_item = f120_rowid
            INNER JOIN t470_cm_movto_invent mov
                ON mov.f470_rowid_item_ext = f121_rowid
            INNER JOIN t350_co_docto_contable doc
                ON doc.f350_rowid = mov.f470_rowid_docto
            INNER JOIN t150_mc_bodegas bod
                ON bod.f150_rowid = mov.f470_rowid_bodega
            INNER JOIN t200_mm_terceros ter
                ON ter.f200_rowid = doc.f350_rowid_tercero
            WHERE 
                f120_id_cia = 2
                AND f200_nit IN ('900012728','824006708','900486803','901047298','802005075')
                AND f350_ind_estado = 1
                AND f120_id IN ('8')
                AND f350_id_tipo_docto IN ('EC','AC')
                AND mov.f470_id_fecha >= ?
                AND mov.f470_id_fecha <=  ?
        """;

        Double resultado = siesaJdbcTemplate.queryForObject(sql, Double.class, fechaInicio, fechaFin);

        return new IndustrializacionAceiteDTO(resultado != null ? resultado : 0.0);
    }
}
