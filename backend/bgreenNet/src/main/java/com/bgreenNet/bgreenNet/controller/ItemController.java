package com.bgreenNet.bgreenNet.controller;

import com.bgreenNet.bgreenNet.dto.ItemExistenciaDTO;
import com.bgreenNet.bgreenNet.services.ItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/items", "/items"})
@CrossOrigin(origins = "*")
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    /**
     * Consulta las existencias y costos en bodega.
     * Permite consultar todas las bodegas o filtrar por una o más bodegas específicas.
     * GET /api/items/existencias?bodega=BALG&busqueda=...
     */
    @GetMapping("/existencias")
    public ResponseEntity<?> getExistencias(
            @RequestParam(value = "bodega", required = false) String bodega,
            @RequestParam(value = "busqueda", required = false) String busqueda) {
        try {
            List<ItemExistenciaDTO> items = itemService.getExistencias(bodega, busqueda);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error al consultar existencias en Siesa: " + e.getMessage()
            ));
        }
    }

    /**
     * Lista de bodegas disponibles en Siesa.
     * GET /api/items/bodegas
     */
    @GetMapping("/bodegas")
    public ResponseEntity<?> getBodegas() {
        try {
            List<Map<String, Object>> bodegas = itemService.getBodegas();
            return ResponseEntity.ok(bodegas);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error al consultar bodegas en Siesa: " + e.getMessage()
            ));
        }
    }

    /**
     * Resumen de métricas de existencias para las bodegas.
     * GET /api/items/resumen?bodega=...
     */
    @GetMapping("/resumen")
    public ResponseEntity<?> getResumen(
            @RequestParam(value = "bodega", required = false) String bodega) {
        try {
            Map<String, Object> resumen = itemService.getResumenExistencias(bodega);
            return ResponseEntity.ok(resumen);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error al consultar resumen en Siesa: " + e.getMessage()
            ));
        }
    }
}
