package com.bgreenNet.bgreenNet.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.bgreenNet.bgreenNet.dto.PulsoCreateDTO;
import com.bgreenNet.bgreenNet.dto.PulsoResponseDTO;
import com.bgreenNet.bgreenNet.dto.PulsoUpdateDTO;
import com.bgreenNet.bgreenNet.services.PulsoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/pulsos")
public class PulsoController {

    private final PulsoService pulsoService;

    @Autowired
    public PulsoController(PulsoService pulsoService) {
        this.pulsoService = pulsoService;
    }

    @PostMapping
    public ResponseEntity<PulsoCreateResponse> createPulso(
            @Valid @RequestBody PulsoCreateDTO dto) {

        Long id = pulsoService.createPulso(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new PulsoCreateResponse(id, "Pulso creado exitosamente"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updatePulso(
            @PathVariable Long id,
            @Valid @RequestBody PulsoUpdateDTO dto) {

        dto.setId(id);
        pulsoService.updatePulso(dto);
        return ResponseEntity.ok(new ApiResponse("Pulso actualizado exitosamente"));
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<ApiResponse> updateEstado(
            @PathVariable Long id,
            @RequestParam Boolean activo) {

        pulsoService.updateEstado(id, activo);
        String mensaje = activo ? "Pulso activado exitosamente" : "Pulso desactivado exitosamente";
        return ResponseEntity.ok(new ApiResponse(mensaje));
    }

    @GetMapping("/activos")
    public ResponseEntity<List<PulsoResponseDTO>> getActivePulsos() {
        return ResponseEntity.ok(pulsoService.getActivePulsos());
    }

    @GetMapping
    public ResponseEntity<List<PulsoResponseDTO>> getAllPulsos() {
        return ResponseEntity.ok(pulsoService.getAllPulsos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PulsoResponseDTO> getPulsoById(@PathVariable Long id) {
        return ResponseEntity.ok(pulsoService.getPulsoById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deletePulsoFisico(@PathVariable Long id) {
        pulsoService.deletePulsoFisico(id);
        return ResponseEntity.ok(new ApiResponse("Pulso eliminado exitosamente"));
    }

    // ==================== RESPUESTAS ====================

    public static class PulsoCreateResponse {
        private Long id;
        private String mensaje;

        public PulsoCreateResponse(Long id, String mensaje) {
            this.id = id;
            this.mensaje = mensaje;
        }

        public Long getId() { return id; }
        public String getMensaje() { return mensaje; }
    }

    public static class ApiResponse {
        private String mensaje;

        public ApiResponse(String mensaje) {
            this.mensaje = mensaje;
        }

        public String getMensaje() { return mensaje; }
    }
}
