package com.bgreenNet.bgreenNet.controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.bgreenNet.bgreenNet.dto.ConsumptionProductionRequest;
import com.bgreenNet.bgreenNet.dto.ReportRequest;
import com.bgreenNet.bgreenNet.dto.ReportResponse;
import com.bgreenNet.bgreenNet.services.InventoryService;

import jakarta.validation.Valid;


@RestController
@RequestMapping("/api/cmiplanta")

public class ReportController {
	
	@Autowired
    private InventoryService inventoryService;

    @PostMapping("/ComsumoProductos")
    public ReportResponse generateInventoryReport(@RequestBody ReportRequest request) {
        return inventoryService.generateReport(
            request.getStartDate(),
            request.getEndDate(),
            request.getConsumptionProductId(),
            request.getProductionProductId(),
            request.getConsumptionDocTypes(),
            request.getProductionDocTypes()
        );
    }
    
    
    
    
}
