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
    void repositoryConsultaMapeaTodasLas29Columnas() {
        List<String> capturedSqls = new ArrayList<>();
        List<Object[]> capturedArgs = new ArrayList<>();
        LocalDateTime fechaEntrega = LocalDateTime.of(2026, 11, 10, 8, 30);
        LocalDateTime fecha = LocalDateTime.of(2026, 11, 10, 9, 15);
        LocalDateTime f350Fecha = LocalDateTime.of(2026, 11, 10, 10, 0);

        Map<String, Object> row = new HashMap<>();
        row.put("f470_id_ubicacion_aux", "UB1");
        row.put("f470_costo_prom_tot", new BigDecimal("150000.50"));
        row.put("f441_fecha_entrega", Timestamp.valueOf(fechaEntrega));
        row.put("f441_ts", Timestamp.valueOf(fecha));
        row.put("f441_id_concepto", 501);
        row.put("f441_id_motivo", "01 ");
        row.put("f441_id_unidad_medida", "UND ");
        row.put("f441_cant1_consumida", new BigDecimal("5.5000"));
        row.put("f150_id", "01");
        row.put("f010_razon_social", "BIOCOSTA S.A.S");
        row.put("f010_nit", "900123456");
        row.put("f440_id_tipo_docto", "RQ ");
        row.put("f440_consec_docto", 8940);
        row.put("f440_rowid_tercero", 505L);
        row.put("f440_referencia", "REF-01");
        row.put("f440_notas", "Nota de prueba");
        row.put("f440_usuario_creacion", "jdoe");
        row.put("f440_usuario_aprobacion", "aprobad");
        row.put("f440_usuario_cumplido", "cumplid");
        row.put("f440_ind_estado", 1);
        row.put("f440_rowid_tercero_sol", 606L);
        row.put("f440_usuario_parcial", "usuariopar");
        row.put("f120_id", "12345");
        row.put("f120_descripcion", "TORNILLO ACERO");
        row.put("f350_id_tipo_docto", "FC");
        row.put("f350_consec_docto", 1001);
        row.put("f350_fecha", Timestamp.valueOf(f350Fecha));
        row.put("f200_razon_social", "SOLICITANTE PRUEBA");
        row.put("f284_id", "CC-100");

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

        // Consulta por consecutivo 8940
        List<FirmaDigitalRequisicionDTO> porConsec = repository.consultarRequisiciones(null, null, 8940, 2, "RQ");
        assertEquals(1, porConsec.size());
        assertTrue(capturedSqls.get(0).contains("t440.[f440_consec_docto] = ?"));
        assertTrue(capturedSqls.get(0).contains("t200_mm_terceros"));
        assertTrue(capturedSqls.get(0).contains("t284_co_ccosto"));
        assertFalse(capturedSqls.get(0).contains("t441.[f441_ts] >= ?"));
        assertEquals(3, capturedArgs.get(0).length);
        assertEquals(2, capturedArgs.get(0)[0]);
        assertEquals("RQ", capturedArgs.get(0)[1]);
        assertEquals(8940, capturedArgs.get(0)[2]);

        FirmaDigitalRequisicionDTO dto = porConsec.get(0);
        assertEquals("UB1", dto.getF470IdUbicacionAux());
        assertEquals(new BigDecimal("150000.50"), dto.getF470CostoPromTot());
        assertEquals(fechaEntrega, dto.getF441FechaEntrega());
        assertEquals(fecha, dto.getF441Ts());
        assertEquals(501, dto.getF441IdConcepto());
        assertEquals("01", dto.getF441IdMotivo());
        assertEquals("UND", dto.getF441IdUnidadMedida());
        assertEquals(new BigDecimal("5.5000"), dto.getF441Cant1Consumida());
        assertEquals("01", dto.getF150Id());
        assertEquals("BIOCOSTA S.A.S", dto.getF010RazonSocial());
        assertEquals("900123456", dto.getF010Nit());
        assertEquals("RQ", dto.getF440IdTipoDocto());
        assertEquals(8940, dto.getF440ConsecDocto());
        assertEquals(505L, dto.getF440RowidTercero());
        assertEquals("REF-01", dto.getF440Referencia());
        assertEquals("Nota de prueba", dto.getF440Notas());
        assertEquals("jdoe", dto.getF440UsuarioCreacion());
        assertEquals("aprobad", dto.getF440UsuarioAprobacion());
        assertEquals("cumplid", dto.getF440UsuarioCumplido());
        assertEquals(1, dto.getF440IndEstado());
        assertEquals(606L, dto.getF440RowidTerceroSol());
        assertEquals("usuariopar", dto.getF440UsuarioParcial());
        assertEquals("12345", dto.getF120Id());
        assertEquals("TORNILLO ACERO", dto.getF120Descripcion());
        assertEquals("FC", dto.getF350IdTipoDocto());
        assertEquals(1001, dto.getF350ConsecDocto());
        assertEquals(f350Fecha, dto.getF350Fecha());
        assertEquals("SOLICITANTE PRUEBA", dto.getF200RazonSocial());
        assertEquals("CC-100", dto.getF284Id());
    }

    @Test
    void servicePermiteConsecutivoORangoDeFechas() {
        List<Object[]> calls = new ArrayList<>();
        FirmaDigitalRepository stubRepo = new FirmaDigitalRepository(new JdbcTemplate()) {
            @Override
            public List<FirmaDigitalRequisicionDTO> consultarRequisiciones(
                    LocalDate fechaInicio, LocalDate fechaFin, Integer consecDocto, Integer idCia, String tipoDocto) {
                calls.add(new Object[] { fechaInicio, fechaFin, consecDocto, idCia, tipoDocto });
                return List.of();
            }
        };

        FirmaDigitalService service = new FirmaDigitalService(stubRepo);

        // Caso 1: Solo consecutivo
        service.obtenerRequisiciones(null, null, 8940, null, null);
        assertEquals(1, calls.size());
        assertEquals(null, calls.get(0)[0]);
        assertEquals(null, calls.get(0)[1]);
        assertEquals(8940, calls.get(0)[2]);
        assertEquals(2, calls.get(0)[3]);
        assertEquals("RQ", calls.get(0)[4]);

        // Caso 2: Rango de fechas
        service.obtenerRequisiciones("2026-11-01", "2026-11-10", null, null, null);
        assertEquals(2, calls.size());
        assertEquals(LocalDate.of(2026, 11, 1), calls.get(1)[0]);
        assertEquals(LocalDate.of(2026, 11, 10), calls.get(1)[1]);
        assertEquals(null, calls.get(1)[2]);

        // Validaciones
        assertThrows(IllegalArgumentException.class, () -> service.obtenerRequisiciones(null, null, null, null, null));
        assertThrows(IllegalArgumentException.class, () -> service.obtenerRequisiciones(null, null, -1, null, null));
        assertThrows(IllegalArgumentException.class, () -> service.obtenerRequisiciones("2026-11-10", "2026-11-01", null, null, null));
        assertThrows(IllegalArgumentException.class, () -> service.obtenerRequisiciones("2026-11-01", null, null, null, null));
    }

    @Test
    void controllerRespondeOkYBadRequest() {
        FirmaDigitalRequisicionDTO dto = new FirmaDigitalRequisicionDTO();
        dto.setF440ConsecDocto(8940);

        FirmaDigitalRepository stubRepo = new FirmaDigitalRepository(new JdbcTemplate()) {
            @Override
            public List<FirmaDigitalRequisicionDTO> consultarRequisiciones(
                    LocalDate fechaInicio, LocalDate fechaFin, Integer consecDocto, Integer idCia, String tipoDocto) {
                return List.of(dto);
            }
        };

        FirmaDigitalService service = new FirmaDigitalService(stubRepo);
        FirmaDigitalController controller = new FirmaDigitalController(service);

        FirmaDigitalRequisicionRequestDTO reqOk = new FirmaDigitalRequisicionRequestDTO();
        reqOk.setConsecDocto(8940);
        ResponseEntity<?> okResp = controller.obtenerRequisiciones(reqOk);
        assertEquals(HttpStatus.OK, okResp.getStatusCode());

        ResponseEntity<?> nullBody = controller.obtenerRequisiciones(null);
        assertEquals(HttpStatus.BAD_REQUEST, nullBody.getStatusCode());
    }
}
