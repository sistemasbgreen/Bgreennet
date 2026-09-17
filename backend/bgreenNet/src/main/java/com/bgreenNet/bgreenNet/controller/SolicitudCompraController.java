package com.bgreenNet.bgreenNet.controller;

import com.bgreenNet.bgreenNet.dto.SolicitudCompraDTO;
import com.bgreenNet.bgreenNet.services.SolicitudCompraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping({"/api/solicitudes-compra", "/solicitudes-compra"})
@CrossOrigin(origins = "*")
public class SolicitudCompraController {

    @Autowired
    private SolicitudCompraService service;

    /**
     * Endpoint GET /api/solicitudes-compra
     * Si no se pasan parámetros, devuelve la consulta exacta solicitada:
     * SELECT f420_ts, f420_rowid, f420_id_tipo_docto, ...
     * FROM t420_cm_oc_docto
     * WHERE f420_id_tipo_docto IN ('SS', 'SC') AND f420_id_cia = 2
     * ORDER BY f420_ts DESC;
     *
     * Soporta además filtros opcionales por:
     * - tipoDocto (SS, SC)
     * - estado
     * - fechaInicio (YYYY-MM-DD)
     * - fechaFin (YYYY-MM-DD)
     */
    @GetMapping
    public ResponseEntity<?> listarSolicitudes(
            @RequestParam(required = false) String tipoDocto,
            @RequestParam(required = false) Integer estado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        try {
            List<SolicitudCompraDTO> resultados;
            if (tipoDocto != null || estado != null || fechaInicio != null || fechaFin != null) {
                resultados = service.obtenerPorFiltros(tipoDocto, estado, fechaInicio, fechaFin);
            } else {
                resultados = service.obtenerTodas();
            }
            return ResponseEntity.ok(resultados);
        } catch (Exception e) {
            System.err.println("Error en SolicitudCompraController.listarSolicitudes: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error al consultar solicitudes de compra: " + e.getMessage());
        }
    }
}
