package com.bgreenNet.bgreenNet;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;

@SpringBootTest
class BgreenNetApplicationTests {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	@Qualifier("siesaJdbcTemplate")
	private JdbcTemplate siesaJdbcTemplate;

	@Test
	void contextLoads() {
		try {
			System.out.println("=== PRODUCTOS CONFIG ===");
			List<Map<String, Object>> products = jdbcTemplate.queryForList(
				"SELECT id, nombre, id_producto_siesa, usa_suma, sentido_meta FROM productos WHERE id IN ('10', '13') OR id_producto_siesa IN ('10', '13')"
			);
			for (Map<String, Object> p : products) {
				System.out.println(p);
			}

			System.out.println("=== DOCUMENTOS CONFIG ===");
			List<Map<String, Object>> docs = jdbcTemplate.queryForList(
				"SELECT ptd.producto_id, tm.codigo as tipo_mov, td.codigo as doc_cod, ptd.orden, ptd.producto_origen_id " +
				"FROM producto_tipos_documento ptd " +
				"JOIN tipo_movimiento tm ON ptd.tipo_movimiento_id = tm.id " +
				"JOIN tipos_documento td ON ptd.tipo_documento_id = td.id " +
				"WHERE ptd.producto_id IN ('3', '4', '10', '13') OR ptd.producto_id IN (SELECT id FROM productos WHERE id_producto_siesa IN ('10', '13'))"
			);
			for (Map<String, Object> d : docs) {
				System.out.println(d);
			}

			System.out.println("=== SIESA MOVEMENT SAMPLE FOR 10 ===");
			String sql = "SELECT TOP 10 CONVERT(VARCHAR, mov.f470_id_fecha, 23) AS fecha, doc.f350_id_tipo_docto AS tipo_docto, " +
				"SUM(CASE WHEN f470_ind_naturaleza = 2 THEN f470_cant_base ELSE 0 END) AS salidas, " +
				"SUM(CASE WHEN f470_ind_naturaleza = 1 THEN f470_cant_base ELSE 0 END) AS entradas " +
				"FROM [t124_mc_items_referencias] " +
				"LEFT JOIN [t120_mc_items] item ON f120_rowid = f124_rowid_item " +
				"INNER JOIN [t121_mc_items_extensiones] ON f121_rowid_item = f120_rowid " +
				"INNER JOIN [t470_cm_movto_invent] mov ON mov.f470_rowid_item_ext = f121_rowid " +
				"INNER JOIN [t350_co_docto_contable] doc ON doc.f350_rowid = mov.f470_rowid_docto " +
				"WHERE mov.f470_id_fecha BETWEEN '2026-07-01' AND '2026-07-20' " +
				"AND f120_id_cia = 2 AND f350_ind_estado = 1 AND f120_id = '10' " +
				"GROUP BY mov.f470_id_fecha, doc.f350_id_tipo_docto " +
				"ORDER BY mov.f470_id_fecha";
			List<Map<String, Object>> siesaMovs = siesaJdbcTemplate.queryForList(sql);
			for (Map<String, Object> m : siesaMovs) {
				System.out.println(m);
			}

		} catch (Exception e) {
			e.printStackTrace();
		}
	}

}

