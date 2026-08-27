package com.bgreenNet.bgreenNet.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.services.PlcDbService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/plc-db", "/plc-db"})
public class PlcDbController {

    private final PlcDbService plcDbService;

    public PlcDbController(PlcDbService plcDbService) {
        this.plcDbService = plcDbService;
    }

    @GetMapping("/vapor")
    public ResponseEntity<List<Map<String, Object>>> obtenerVapor(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        List<Map<String, Object>> datos = plcDbService.obtenerVapor(startDate, endDate);
        return ResponseEntity.ok(datos);
    }

    @GetMapping("/energia")
    public ResponseEntity<List<Map<String, Object>>> obtenerEnergia(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        List<Map<String, Object>> datos = plcDbService.obtenerEnergia(startDate, endDate);
        return ResponseEntity.ok(datos);
    }

    @GetMapping("/agua")
    public ResponseEntity<List<Map<String, Object>>> obtenerAgua(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        List<Map<String, Object>> datos = plcDbService.obtenerAgua(startDate, endDate);
        return ResponseEntity.ok(datos);
    }

    @GetMapping("/vapor/anual")
    public ResponseEntity<List<Map<String, Object>>> obtenerVaporAnual(
            @RequestParam String year,
            @RequestParam(required = false) String endMonth) {
        List<Map<String, Object>> datos = plcDbService.obtenerVaporAnual(year, endMonth);
        return ResponseEntity.ok(datos);
    }

    @GetMapping("/energia/anual")
    public ResponseEntity<List<Map<String, Object>>> obtenerEnergiaAnual(
            @RequestParam String year,
            @RequestParam(required = false) String endMonth) {
        List<Map<String, Object>> datos = plcDbService.obtenerEnergiaAnual(year, endMonth);
        return ResponseEntity.ok(datos);
    }

    @GetMapping("/agua/anual")
    public ResponseEntity<List<Map<String, Object>>> obtenerAguaAnual(
            @RequestParam String year,
            @RequestParam(required = false) String endMonth) {
        List<Map<String, Object>> datos = plcDbService.obtenerAguaAnual(year, endMonth);
        return ResponseEntity.ok(datos);
    }
}
