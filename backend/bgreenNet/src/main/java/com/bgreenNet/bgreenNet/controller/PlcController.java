package com.bgreenNet.bgreenNet.controller;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.services.PlcService;

@RestController
@RequestMapping("/plc")
public class PlcController {

    private final PlcService plcService;

    public PlcController(PlcService plcService) {
        this.plcService = plcService;
    }

    @GetMapping("/leer")
    public ResponseEntity<Map<String, Float>> obtenerTrending() {

        Map<String, Float> datos = plcService.leerTodas();

        return ResponseEntity.ok(datos);
    }
}

