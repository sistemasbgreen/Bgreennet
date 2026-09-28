package com.bgreenNet.bgreenNet.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Calendar;
import java.util.List;
import java.util.Map;

import com.bgreenNet.bgreenNet.dto.IndustrializacionDetalleDTO;
import com.bgreenNet.bgreenNet.dto.IndustrializacionProveedorConfigDTO;
import com.bgreenNet.bgreenNet.services.IndustrializacionAceiteServices;

@RestController
@RequestMapping({"/api/estrategicos", "/estrategicos"})
@CrossOrigin(origins = "*")
public class IndustrializacionAceiteController {

    private final IndustrializacionAceiteServices industrializacionAceiteServices;

    public IndustrializacionAceiteController(IndustrializacionAceiteServices indicadorService) {
        this.industrializacionAceiteServices = indicadorService;
    }

    @PostMapping("/industrializacion")
    public IndustrializacionDetalleDTO getIndicador(@RequestBody(required = false) Map<String, Object> payload) {
        int year = Calendar.getInstance().get(Calendar.YEAR);
        int month = Calendar.getInstance().get(Calendar.MONTH) + 1;

        if (payload != null) {
            if (payload.containsKey("anio") && payload.get("anio") != null) {
                year = Integer.parseInt(payload.get("anio").toString());
            } else if (payload.containsKey("fecha") && payload.get("fecha") != null) {
                year = Integer.parseInt(payload.get("fecha").toString());
            }

            if (payload.containsKey("mes") && payload.get("mes") != null) {
                month = Integer.parseInt(payload.get("mes").toString());
            }
        }

        return industrializacionAceiteServices.obtenerIndicadorDetalle(year, month);
    }

    @GetMapping("/industrializacion/config")
    public ResponseEntity<?> getConfig() {
        try {
            Double metaAnual = industrializacionAceiteServices.obtenerMetaAnual();
            List<IndustrializacionProveedorConfigDTO> proveedores = industrializacionAceiteServices.obtenerProveedoresConfigured(false);
            return ResponseEntity.ok(Map.of(
                "metaAnual", metaAnual,
                "proveedores", proveedores
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/industrializacion/config/proveedores")
    public ResponseEntity<?> agregarProveedor(@RequestBody Map<String, String> body) {
        try {
            String nit = body.get("nit");
            String nombre = body.get("nombre");
            if (nit == null || nit.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El NIT es obligatorio"));
            }
            industrializacionAceiteServices.agregarProveedor(nit, nombre);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/industrializacion/config/proveedores/{id}/toggle")
    public ResponseEntity<?> toggleProveedor(@PathVariable Integer id, @RequestBody Map<String, Boolean> body) {
        try {
            Boolean activo = body.getOrDefault("activo", true);
            industrializacionAceiteServices.toggleProveedor(id, activo);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/industrializacion/config/proveedores/{id}")
    public ResponseEntity<?> eliminarProveedor(@PathVariable Integer id) {
        try {
            industrializacionAceiteServices.eliminarProveedor(id);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/industrializacion/config/meta")
    public ResponseEntity<?> actualizarMeta(@RequestBody Map<String, Object> body) {
        try {
            Double metaAnual = Double.parseDouble(body.get("metaAnual").toString());
            industrializacionAceiteServices.actualizarMetaAnual(metaAnual);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/industrializacion/siesa/proveedor/{nit}")
    public ResponseEntity<?> buscarProveedorEnSiesa(@PathVariable String nit) {
        try {
            return ResponseEntity.ok(industrializacionAceiteServices.buscarProveedorEnSiesa(nit));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
