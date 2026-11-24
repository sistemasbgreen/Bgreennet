package com.bgreenNet.bgreenNet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import com.bgreenNet.bgreenNet.controller.InventarioSvisionController;
import com.bgreenNet.bgreenNet.dto.InventarioSvisionDTO;
import com.bgreenNet.bgreenNet.repository.InventarioSvisionRepository;
import com.bgreenNet.bgreenNet.services.InventarioSvisionService;

class InventarioSvisionTest {

    @Test
    void repositoryMapeaTodasLasColumnasYFiltros() {
        List<String> capturedSqls = new ArrayList<>();
        List<Object[]> capturedArgs = new ArrayList<>();

        Map<String, Object> row = new HashMap<>();
        row.put("CantidadExistente", new BigDecimal("125.50"));
        row.put("CostoPromedio", new BigDecimal("450000.00"));
        row.put("Items", "1001 ");
        row.put("Descripcion", "ACEITE CRUDO DE PALMA ");
        row.put("UND", "KG ");
        row.put("TipoInventario", "MP ");
        row.put("DescripcionCorta", "ACEITE PALMA ");
        row.put("Bodega", "BALG ");
        row.put("DescripcionBodega", "BODEGA ALMACEN GENERAL ");
        row.put("DescripcionTipoInventario", "MATERIA PRIMA ");

        ResultSet rsProxy = (ResultSet) Proxy.newProxyInstance(
                ResultSet.class.getClassLoader(),
                new Class<?>[] { ResultSet.class },
                (proxy, method, args) -> {
                    if (args != null && args.length == 1 && args[0] instanceof String col) {
                        return row.get(col);
                    }
                    return null;
                }
        );

        JdbcTemplate stubJdbc = new JdbcTemplate() {
            @Override
            public <T> List<T> query(String sql, RowMapper<T> rowMapper, Object... args) {
                capturedSqls.add(sql);
                capturedArgs.add(args);
                try {
                    return List.of(rowMapper.mapRow(rsProxy, 0));
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }
        };

        InventarioSvisionRepository repository = new InventarioSvisionRepository(stubJdbc);
        List<InventarioSvisionDTO> resultado = repository.consultarInventario(2, "BALG", "MP");

        assertEquals(1, resultado.size());
        assertTrue(capturedSqls.get(0).contains("t400_cm_existencia"));
        assertTrue(capturedSqls.get(0).contains("t149_mc_tipo_inv_serv"));
        assertEquals(3, capturedArgs.get(0).length);
        assertEquals(2, capturedArgs.get(0)[0]);
        assertEquals("BALG", capturedArgs.get(0)[1]);
        assertEquals("MP", capturedArgs.get(0)[2]);

        InventarioSvisionDTO dto = resultado.get(0);
        assertEquals(new BigDecimal("125.50"), dto.getCantidadExistente());
        assertEquals(new BigDecimal("450000.00"), dto.getCostoPromedio());
        assertEquals("1001", dto.getItems());
        assertEquals("ACEITE CRUDO DE PALMA", dto.getDescripcion());
        assertEquals("KG", dto.getUnd());
        assertEquals("MP", dto.getTipoInventario());
        assertEquals("ACEITE PALMA", dto.getDescripcionCorta());
        assertEquals("BALG", dto.getBodega());
        assertEquals("BODEGA ALMACEN GENERAL", dto.getDescripcionBodega());
        assertEquals("MATERIA PRIMA", dto.getDescripcionTipoInventario());
    }

    @Test
    void serviceYControllerRespondenCorrectamente() {
        InventarioSvisionDTO dto = new InventarioSvisionDTO();
        dto.setItems("1001");

        InventarioSvisionRepository stubRepo = new InventarioSvisionRepository(new JdbcTemplate()) {
            @Override
            public List<InventarioSvisionDTO> consultarInventario(Integer idCia, String bodega, String tipoInventario) {
                assertEquals(2, idCia);
                return List.of(dto);
            }
        };

        InventarioSvisionService service = new InventarioSvisionService(stubRepo);
        InventarioSvisionController controller = new InventarioSvisionController(service);

        ResponseEntity<?> response = controller.obtenerInventario(null, null, null);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}
