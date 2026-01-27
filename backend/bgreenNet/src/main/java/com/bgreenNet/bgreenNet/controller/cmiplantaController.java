package com.bgreenNet.bgreenNet.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.dto.CmiplantaRequest;
import com.bgreenNet.bgreenNet.dto.CmiplantaResponseDTO;
import com.bgreenNet.bgreenNet.services.cmiplantaServices;

@RestController
@RequestMapping("/api/cmiplanta")
public class cmiplantaController {

	@Autowired
    private cmiplantaServices cmiplantaService;

    @PostMapping("/ConsumoProductos")
    public CmiplantaResponseDTO generateInventoryReport(@RequestBody CmiplantaRequest request) {
        return cmiplantaService.generateReport(
            request.getStartDate(),
            request.getEndDate(),
            request.getConsumptionProductId(),
            request.getProductionProductId(),
            request.getConsumptionDocTypes(),
            request.getProductionDocTypes()
        );
    }    
    
}