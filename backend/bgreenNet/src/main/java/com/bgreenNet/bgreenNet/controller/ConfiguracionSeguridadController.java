package com.bgreenNet.bgreenNet.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.bgreenNet.bgreenNet.dto.PropiedadesServidorDTO;
import com.bgreenNet.bgreenNet.models.ConfiguracionSeguridad;
import com.bgreenNet.bgreenNet.services.ConfiguracionPropiedadesService;
import com.bgreenNet.bgreenNet.services.ConfiguracionSeguridadService;

@RestController
@RequestMapping({"/api/configuracion-seguridad", "/configuracion-seguridad"})
public class ConfiguracionSeguridadController {

    private static final Logger log = LoggerFactory.getLogger(ConfiguracionSeguridadController.class);

    @Autowired
    private ConfiguracionSeguridadService service;

    @Autowired
    private ConfiguracionPropiedadesService propiedadesService;

    @GetMapping
    public ResponseEntity<ConfiguracionSeguridad> get() {
        return ResponseEntity.ok(service.obtenerConfiguracion());
    }

    @PutMapping
    public ResponseEntity<ConfiguracionSeguridad> update(@RequestBody ConfiguracionSeguridad configuracion) {
        return ResponseEntity.ok(service.actualizarConfiguracion(configuracion));
    }

    @GetMapping("/propiedades-servidor")
    public ResponseEntity<?> getPropiedadesServidor() {
        try {
            PropiedadesServidorDTO dto = propiedadesService.obtenerPropiedadesServidor();
            
            // Serialize manually to catch Jackson serialization errors within this block
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String json = mapper.writeValueAsString(dto);
            
            return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(json);
        } catch (Throwable e) {
            log.error("[ConfiguracionSeguridadController] Error al obtener propiedades del servidor: {}", e.getMessage(), e);
            
            // Return JSON so the frontend can parse the error if it expects JSON
            String errorMessage = e.getMessage() != null ? e.getMessage().replace("\"", "\\\"") : "No details";
            String jsonError = "{\"error\": \"Error al obtener propiedades del servidor\", \"details\": \"" + e.getClass().getName() + ": " + errorMessage + "\"}";
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(jsonError);
        }
    }
}
