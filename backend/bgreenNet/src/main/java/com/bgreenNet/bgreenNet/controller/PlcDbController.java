package com.bgreenNet.bgreenNet.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.services.PlcDbService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/plc-db")
public class PlcDbController {

    private final PlcDbService plcDbService;

    public PlcDbController(PlcDbService plcDbService) {
        this.plcDbService = plcDbService;
    }

    @GetMapping("/vapor")
    public ResponseEntity<List<Map<String, Object>>> obtenerVapor() {
        List<Map<String, Object>> datos = plcDbService.obtenerVapor();
        return ResponseEntity.ok(datos);
    }

    @GetMapping("/energia")
    public ResponseEntity<?> obtenerEnergia() {
        try {
            List<Map<String, Object>> datos = plcDbService.obtenerEnergia();
            if (!datos.isEmpty()) {
                System.out.println("✔ [PlcDbController] Tabla_15 leida. Registros: " + datos.size());
                System.out.println("✔ [PlcDbController] Columnas en Tabla_15: " + datos.get(0).keySet());
            } else {
                System.out.println("⚠ [PlcDbController] Tabla_15 esta vacia.");
            }
            return ResponseEntity.ok(datos);
        } catch (Exception e) {
            System.err.println("❌ [PlcDbController] Error al obtener datos de Tabla_15: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
