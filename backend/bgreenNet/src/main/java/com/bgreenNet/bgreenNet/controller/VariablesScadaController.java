package com.bgreenNet.bgreenNet.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping({"/api/scada", "/scada"})
@CrossOrigin(origins = "*") // luego puedes restringir a tu Angular
public class VariablesScadaController {



    // 🔹 Trae el último registro (el más reciente por timestamp)

}
