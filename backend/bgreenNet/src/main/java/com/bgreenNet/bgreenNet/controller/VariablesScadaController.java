package com.bgreenNet.bgreenNet.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.models.VariablesScada;
import com.bgreenNet.bgreenNet.services.VariablesScadaService;

@RestController
@RequestMapping("/api/scada")
@CrossOrigin(origins = "*") // luego puedes restringir a tu Angular
public class VariablesScadaController {

    @Autowired
    private VariablesScadaService service;

    // 🔹 Trae el último registro (el más reciente por timestamp)
    @GetMapping("/ultimo")
    public VariablesScada obtenerUltimo() {
        return service.obtenerUltimo();
    }
}
