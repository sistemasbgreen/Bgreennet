package com.bgreenNet.bgreenNet.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.dto.FirmaDigitalRequisicionDTO;
import com.bgreenNet.bgreenNet.dto.FirmaDigitalRequisicionRequestDTO;
import com.bgreenNet.bgreenNet.services.FirmaDigitalService;

/**
 * Controlador REST para el módulo de firmas digitales.
 */
@RestController
@RequestMapping({"/api/firmasdigital", "/firmasdigital"})
@CrossOrigin(origins = "*")
public class FirmaDigitalController {

    private final FirmaDigitalService firmaDigitalService;

    public FirmaDigitalController(FirmaDigitalService firmaDigitalService) {
        this.firmaDigitalService = firmaDigitalService;
    }

    /**
     * Consulta los movimientos de requisiciones por rango de fechas en el body JSON.
     * POST /api/firmasdigital/requisiciones
     * Body: { "fechaInicio": "2026-11-01", "fechaFin": "2026-11-10", "consecDocto": 5939, "idCia": 2, "tipoDocto": "RQ" }
     */
    @PostMapping("/requisiciones")
    public ResponseEntity<?> obtenerRequisiciones(
            @RequestBody(required = false) FirmaDigitalRequisicionRequestDTO request) {
        try {
            if (request == null) {
                throw new IllegalArgumentException("El cuerpo de la petición es obligatorio con 'fechaInicio' y 'fechaFin'.");
            }
            List<FirmaDigitalRequisicionDTO> resultados = firmaDigitalService.obtenerRequisiciones(
                    request.getFechaInicio(),
                    request.getFechaFin(),
                    request.getConsecDocto(),
                    request.getIdCia(),
                    request.getTipoDocto()
            );
            return ResponseEntity.ok(resultados);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Parámetros inválidos",
                    "detalle", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Error al consultar requisiciones en Siesa",
                    "detalle", e.getMessage()
            ));
        }
    }
}
