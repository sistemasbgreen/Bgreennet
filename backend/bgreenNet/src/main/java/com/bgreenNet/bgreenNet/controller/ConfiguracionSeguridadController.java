package com.bgreenNet.bgreenNet.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.bgreenNet.bgreenNet.models.ConfiguracionSeguridad;
import com.bgreenNet.bgreenNet.services.ConfiguracionSeguridadService;

@RestController
@RequestMapping({"/api/configuracion-seguridad", "/configuracion-seguridad"})
public class ConfiguracionSeguridadController {

    @Autowired
    private ConfiguracionSeguridadService service;

    @GetMapping
    public ResponseEntity<ConfiguracionSeguridad> get() {
        return ResponseEntity.ok(service.obtenerConfiguracion());
    }

    @PutMapping
    public ResponseEntity<ConfiguracionSeguridad> update(@RequestBody ConfiguracionSeguridad configuracion) {
        return ResponseEntity.ok(service.actualizarConfiguracion(configuracion));
    }
}
