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
}
