package com.bgreenNet.bgreenNet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import com.bgreenNet.bgreenNet.controller.FirmaDigitalController;
import com.bgreenNet.bgreenNet.dto.FirmaDigitalRequisicionDTO;
import com.bgreenNet.bgreenNet.dto.FirmaDigitalRequisicionRequestDTO;
import com.bgreenNet.bgreenNet.repository.FirmaDigitalRepository;
import com.bgreenNet.bgreenNet.services.FirmaDigitalService;

class FirmaDigitalServiceAndControllerTest {

    @Test
    void repositoryConsultaPorRangoDeFechaYConsecDoctoOpcional() {
        List<String> capturedSqls = new ArrayList<>();
        List<Object[]> capturedArgs = new ArrayList<>();
        LocalDateTime fechaEntrega = LocalDateTime.of(2026, 11, 10, 8, 30);
        LocalDateTime ts = LocalDateTime.of(2026, 11, 10, 9, 15);

        Map<String, Object> row = new HashMap<>();
        row.put("f441_fecha_entrega", Timestamp.valueOf(fechaEntrega));
        row.put("f441_ts", Timestamp.valueOf(ts));
        row.put("f441_rowid", 101L);
        row.put("f441_rowid_docto_req_int", 202L);
        row.put("f441_id_cia", 2);
        row.put("f441_rowid_item_ext", 303L);
        row.put("f441_rowid_bodega", 404L);
        row.put("f441_id_concepto", 501);
        row.put("f441_id_motivo", "01 ");
        row.put("f441_id_unidad_medida", "UND ");
        row.put("f441_factor", new BigDecimal("1.0000"));
        row.put("f441_cant1_consumida", new BigDecimal("5.5000"));
        row.put("f440_id_tipo_docto", "RQ ");
        row.put("f440_consec_docto", 5939);
        row.put("f440_rowid_tercero", 505L);
        row.put("f440_referencia", "REF-01");
        row.put("f440_notas", "Nota de prueba");
        row.put("f440_usuario_creacion", "jdoe");
        row.put("f440_usuario_aprobacion", "aprobad");
        row.put("f440_usuario_cumplido", "cumplid");
        row.put("f470_rowid_item_ext", 303L);
        row.put("f470_id_ubicacion_aux", "UB1");
        row.put("f470_id_periodo", "202611");
        row.put("f470_rowid_movto_req_int", 101L);
        row.put("f120_descripcion", "TORNILLO ACERO");
        row.put("f120_descripcion_corta", "TORNILLO");
        row.put("f120_id", "12345");

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

        FirmaDigitalRepository repository = new FirmaDigitalRepository(stubJdbc);
        LocalDate inicio = LocalDate.of(2026, 11, 1);
        LocalDate fin = LocalDate.of(2026, 11, 10);

        // Sin consecDocto
        List<FirmaDigitalRequisicionDTO> sinConsec = repository.consultarRequisicionesPorFecha(inicio, fin, null, 2, "RQ");
        assertEquals(1, sinConsec.size());
        assertFalse(capturedSqls.get(0).contains("f440_consec_docto = ?"));
        assertEquals(4, capturedArgs.get(0).length);
        assertEquals(Timestamp.valueOf(inicio.atStartOfDay()), capturedArgs.get(0)[0]);
        assertEquals(Timestamp.valueOf(fin.plusDays(1).atStartOfDay()), capturedArgs.get(0)[1]);
        assertEquals(2, capturedArgs.get(0)[2]);
        assertEquals("RQ", capturedArgs.get(0)[3]);

        // Con consecDocto opcional
        List<FirmaDigitalRequisicionDTO> conConsec = repository.consultarRequisicionesPorFecha(inicio, fin, 5939, 2, "RQ");
        assertEquals(1, conConsec.size());
        assertTrue(capturedSqls.get(1).contains("f440_consec_docto = ?"));
        assertEquals(5, capturedArgs.get(1).length);
        assertEquals(5939, capturedArgs.get(1)[4]);

        FirmaDigitalRequisicionDTO dto = conConsec.get(0);
        assertEquals(fechaEntrega, dto.getF441FechaEntrega());
        assertEquals(ts, dto.getF441Ts());
        assertEquals(101L, dto.getF441Rowid());
        assertEquals(5939, dto.getF440ConsecDocto());
        assertEquals("RQ", dto.getF440IdTipoDocto());
        assertEquals("01", dto.getF441IdMotivo());
        assertEquals("UND", dto.getF441IdUnidadMedida());
        assertEquals("TORNILLO ACERO", dto.getF120Descripcion());
        assertEquals("12345", dto.getF120Id());
    }

    @Test
    void serviceValidaRangoFechasYAplicaDefaults() {
        List<Object[]> calls = new ArrayList<>();
        FirmaDigitalRepository stubRepo = new FirmaDigitalRepository(new JdbcTemplate()) {
            @Override
            public List<FirmaDigitalRequisicionDTO> consultarRequisicionesPorFecha(
                    LocalDate fechaInicio, LocalDate fechaFin, Integer consecDocto, Integer idCia, String tipoDocto) {
                calls.add(new Object[] { fechaInicio, fechaFin, consecDocto, idCia, tipoDocto });
                return List.of();
            }
        };

        FirmaDigitalService service = new FirmaDigitalService(stubRepo);
        List<FirmaDigitalRequisicionDTO> lista = service.obtenerRequisiciones(
                "2026-11-01", "2026-11-10T23:59:59", null, null, " rq ");

        assertNotNull(lista);
        assertEquals(1, calls.size());
        assertEquals(LocalDate.of(2026, 11, 1), calls.get(0)[0]);
        assertEquals(LocalDate.of(2026, 11, 10), calls.get(0)[1]);
        assertEquals(null, calls.get(0)[2]);
        assertEquals(2, calls.get(0)[3]);
        assertEquals("RQ", calls.get(0)[4]);

        assertThrows(IllegalArgumentException.class, () -> service.obtenerRequisiciones(null, "2026-11-10", null, 2, "RQ"));
        assertThrows(IllegalArgumentException.class, () -> service.obtenerRequisiciones("2026-11-10", "2026-11-01", null, 2, "RQ"));
        assertThrows(IllegalArgumentException.class, () -> service.obtenerRequisiciones("10-11-2026", "2026-11-10", null, 2, "RQ"));
        assertThrows(IllegalArgumentException.class, () -> service.obtenerRequisiciones("2026-11-01", "2026-11-10", 0, 2, "RQ"));
    }

    @Test
    void controllerRespondeOkYBadRequestSegunBody() {
        FirmaDigitalRequisicionDTO dto = new FirmaDigitalRequisicionDTO();
        dto.setF440ConsecDocto(5939);

        FirmaDigitalRepository stubRepo = new FirmaDigitalRepository(new JdbcTemplate()) {
            @Override
            public List<FirmaDigitalRequisicionDTO> consultarRequisicionesPorFecha(
                    LocalDate fechaInicio, LocalDate fechaFin, Integer consecDocto, Integer idCia, String tipoDocto) {
                return List.of(dto);
            }
        };

        FirmaDigitalService service = new FirmaDigitalService(stubRepo);
        FirmaDigitalController controller = new FirmaDigitalController(service);

        FirmaDigitalRequisicionRequestDTO reqOk = new FirmaDigitalRequisicionRequestDTO();
        reqOk.setFechaInicio("2026-11-01");
        reqOk.setFechaFin("2026-11-10");
        ResponseEntity<?> okResp = controller.obtenerRequisiciones(reqOk);
        assertEquals(HttpStatus.OK, okResp.getStatusCode());

        ResponseEntity<?> nullBody = controller.obtenerRequisiciones(null);
        assertEquals(HttpStatus.BAD_REQUEST, nullBody.getStatusCode());

        FirmaDigitalRequisicionRequestDTO reqInvalido = new FirmaDigitalRequisicionRequestDTO();
        reqInvalido.setFechaInicio("2026-11-10");
        reqInvalido.setFechaFin("2026-11-01");
        ResponseEntity<?> badReq = controller.obtenerRequisiciones(reqInvalido);
        assertEquals(HttpStatus.BAD_REQUEST, badReq.getStatusCode());
    }
}
