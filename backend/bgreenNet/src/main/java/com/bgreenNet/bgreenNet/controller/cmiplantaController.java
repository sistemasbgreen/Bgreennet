package com.bgreenNet.bgreenNet.controller;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.dto.CmiplantaRequest;
import com.bgreenNet.bgreenNet.dto.CmiplantaResponseDTO;
import com.bgreenNet.bgreenNet.models.ResultadoDashboard;
import com.bgreenNet.bgreenNet.services.DashboardService;
import com.bgreenNet.bgreenNet.services.cmiplantaServices;

@RestController
@RequestMapping({"/api/cmiplanta", "/cmiplanta"})
public class cmiplantaController {

	@Autowired
    private cmiplantaServices cmiplantaService;
	

    @Autowired
    private DashboardService dashboardService;
    
    
    @PostMapping("/ConsumoProductos")
    public ResponseEntity<?> generateInventoryReport(@RequestBody CmiplantaRequest request) {
        try {
            CmiplantaResponseDTO resp = cmiplantaService.generateReport(
                request.getStartDate(),
                request.getEndDate(),
                request.getConsumptionProductId(),
                request.getProductionProductId(),
                request.getConsumptionDocTypes(),
                request.getProductionDocTypes(),
                request.getConsumptionDocOrigenIds(),
                request.getProductionDocOrigenIds()
            );
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                .body(Map.of("error", e.getMessage() != null ? e.getMessage() : e.toString()));
        }
    }
    
    
    @PostMapping("/datos")
    public ResponseEntity<?> obtenerDatosDashboard(@RequestBody FiltroFechasRequest request) {
        try {
            if (request.getFechaInicio() == null || request.getFechaFin() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Las fechas 'fechaInicio' y 'fechaFin' son obligatorias."));
            }

            ResultadoDashboard resultado = dashboardService.calcularResultados(
                    request.getFechaInicio(),
                    request.getFechaFin()
            );

            return ResponseEntity.ok(resultado);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error interno al procesar la solicitud: " + e.getMessage()));
        }
    }

    // Clase interna para recibir el cuerpo de la petición
    public static class FiltroFechasRequest {
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate fechaInicio;

        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate fechaFin;

        // Getters y setters
        public LocalDate getFechaInicio() {
            return fechaInicio;
        }

        public void setFechaInicio(LocalDate fechaInicio) {
            this.fechaInicio = fechaInicio;
        }

        public LocalDate getFechaFin() {
            return fechaFin;
        }

        public void setFechaFin(LocalDate fechaFin) {
            this.fechaFin = fechaFin;
        }
    }
}
    
