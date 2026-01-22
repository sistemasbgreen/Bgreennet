package com.bgreenNet.bgreenNet.controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.bgreenNet.bgreenNet.dto.ConsumptionProductionRequest;
import com.bgreenNet.bgreenNet.dto.ReportResponse;
import com.bgreenNet.bgreenNet.services.InventoryService;

import jakarta.validation.Valid;


@RestController
@RequestMapping("/api/cmiplanta")

public class ReportController {
	
	@Autowired
    private InventoryService inventoryService;

    @PostMapping("/ComsumoProductos")
    public ResponseEntity<?> getConsumptionProduction(@RequestBody @Valid ConsumptionProductionRequest request) {
        try {
            ReportResponse response = inventoryService.generateReport(
                request.getStartDate(),
                request.getEndDate(),
                request.getConsumptionProductId(),
                request.getProductionProductId()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
