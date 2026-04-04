package com.bgreenNet.bgreenNet.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

import com.bgreenNet.bgreenNet.dto.IndustrializacionAceiteDTO;
import com.bgreenNet.bgreenNet.services.IndustrializacionAceiteServices;


@RestController
@RequestMapping("/api/estrategicos")
public class IndustrializacionAceiteController {
	
	private final IndustrializacionAceiteServices industrializacionAceiteServices;

    public IndustrializacionAceiteController(IndustrializacionAceiteServices indicadorService) {
        this.industrializacionAceiteServices = indicadorService;
    }

    @PostMapping("/industrializacion")
    public IndustrializacionAceiteDTO getIndicador(@RequestBody Map<String, Object> payload) {
        Integer year = 2026;
        if (payload != null && payload.containsKey("fecha")) {
            year = Integer.parseInt(payload.get("fecha").toString());
        }
        return industrializacionAceiteServices.obtenerIndicador(year);
    }

}
