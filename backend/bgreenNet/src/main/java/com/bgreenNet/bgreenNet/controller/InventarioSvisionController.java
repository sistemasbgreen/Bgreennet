package com.bgreenNet.bgreenNet.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.dto.InventarioSvisionDTO;
import com.bgreenNet.bgreenNet.services.InventarioSvisionService;

/**
 * Controlador REST para la API compartida de Inventario Svision.
 */
@RestController
@RequestMapping({"/api/svision", "/svision"})
@CrossOrigin(origins = "*")
public class InventarioSvisionController {

    private final InventarioSvisionService inventarioSvisionService;

    public InventarioSvisionController(InventarioSvisionService inventarioSvisionService) {
        this.inventarioSvisionService = inventarioSvisionService;
    }

    /**
     * Consulta existencias, costos promedio, bodegas y tipo de inventario en Siesa para Svision.
     * GET /api/svision/inventario?idCia=2&bodega=...&tipoInventario=...
     */
    @GetMapping("/inventario")
    public ResponseEntity<?> obtenerInventario(
            @RequestParam(defaultValue = "2") Integer idCia,
            @RequestParam(required = false) String bodega,
            @RequestParam(required = false) String tipoInventario) {
        try {
            List<InventarioSvisionDTO> inventario = inventarioSvisionService.obtenerInventario(
                    idCia,
                    bodega,
                    tipoInventario
            );
            return ResponseEntity.ok(inventario);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Error al consultar inventario Svision en Siesa",
                    "detalle", e.getMessage()
            ));
        }
    }
}
