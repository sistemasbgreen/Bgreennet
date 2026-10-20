package com.bgreenNet.bgreenNet.controller;

import com.bgreenNet.bgreenNet.dto.*;
import com.bgreenNet.bgreenNet.services.SupervisionAsistenciaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/presentismo/supervisores", "/presentismo/supervisores"})
@CrossOrigin(origins = "*")
public class SupervisionAsistenciaController {

    @Autowired
    private SupervisionAsistenciaService service;

    /**
     * Lista resumen agrupada por supervisor para la tabla del Maestro de Configuración
     * GET /api/presentismo/supervisores
     */
    @GetMapping
    public ResponseEntity<List<SupervisorAsignadoResumenDTO>> listarAgrupadas() {
        return ResponseEntity.ok(service.listarAgrupadas());
    }

    /**
     * Lista todas las reglas detalladas
     * GET /api/presentismo/supervisores/todas
     */
    @GetMapping("/todas")
    public ResponseEntity<List<SupervisionAsistenciaDTO>> listarTodas() {
        return ResponseEntity.ok(service.listarTodas());
    }

    /**
     * Obtiene los permisos efectivos de supervisión del usuario autenticado
     * GET /api/presentismo/supervisores/mis-permisos?cedula=...&idUsuario=...
     */
    @GetMapping("/mis-permisos")
    public ResponseEntity<PermisosVisibilidadAsistenciaDTO> misPermisos(
            @RequestParam(value = "cedula", required = false) String cedula,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        return ResponseEntity.ok(service.obtenerMisPermisos(cedula, idUsuario));
    }

    /**
     * Guarda o actualiza la configuración de supervisión
     * POST /api/presentismo/supervisores
     */
    @PostMapping
    public ResponseEntity<?> guardarAsignacion(@RequestBody GuardarSupervisionDTO dto) {
        try {
            service.guardarAsignacion(dto);
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "mensaje", "Configuración de supervisión guardada exitosamente"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al guardar: " + e.getMessage()));
        }
    }

    /**
     * Activa o desactiva una regla específica
     * PATCH /api/presentismo/supervisores/{id}/toggle
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggleActivo(@PathVariable Integer id) {
        try {
            service.toggleActivo(id);
            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Activa o desactiva todas las reglas de un supervisor
     * PATCH /api/presentismo/supervisores/supervisor/{idSupervisor}/toggle
     */
    @PatchMapping("/supervisor/{idSupervisor}/toggle")
    public ResponseEntity<?> toggleActivoSupervisor(
            @PathVariable Integer idSupervisor,
            @RequestBody Map<String, Boolean> body) {
        try {
            Boolean activo = body.getOrDefault("activo", true);
            service.toggleActivoSupervisor(idSupervisor, activo);
            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Elimina una regla individual
     * DELETE /api/presentismo/supervisores/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarRegla(@PathVariable Integer id) {
        try {
            service.eliminarRegla(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Elimina todas las asignaciones de un supervisor
     * DELETE /api/presentismo/supervisores/supervisor/{idSupervisor}
     */
    @DeleteMapping("/supervisor/{idSupervisor}")
    public ResponseEntity<?> eliminarPorSupervisor(@PathVariable Integer idSupervisor) {
        try {
            service.eliminarPorSupervisor(idSupervisor);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
