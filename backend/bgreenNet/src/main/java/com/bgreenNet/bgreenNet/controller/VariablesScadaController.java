package com.bgreenNet.bgreenNet.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import com.bgreenNet.bgreenNet.models.Unidad;
import com.bgreenNet.bgreenNet.models.UnidadMedida;
import com.bgreenNet.bgreenNet.models.VariableScadaConfig;
import com.bgreenNet.bgreenNet.services.VariablesScadaService;
import com.bgreenNet.bgreenNet.services.NodeRedSyncService;

@RestController
@RequestMapping({"/api/scada", "/scada"})
@CrossOrigin(origins = "*") // luego puedes restringir a tu Angular
public class VariablesScadaController {

    private final VariablesScadaService service;
    private final NodeRedSyncService nodeRedSyncService;

    public VariablesScadaController(VariablesScadaService service, NodeRedSyncService nodeRedSyncService) {
        this.service = service;
        this.nodeRedSyncService = nodeRedSyncService;
    }

    // 🔹 Trae el último registro de Tabla_12 (3ª BD: DB_Process_Data_PLCs)
    @GetMapping("/ultimo")
    public Map<String, Object> obtenerUltimo() {
        return service.obtenerUltimo();
    }

    // 🔹 Trae los registros de hoy o de una fecha específica de Tabla_12
    @GetMapping("/hoy")
    public java.util.List<Map<String, Object>> obtenerHistoricoHoy(@RequestParam(value = "fecha", required = false) String fecha) {
        return service.obtenerHistoricoHoy(fecha);
    }

    // 🔹 Obtiene todas las configuraciones de variables gestionadas
    @GetMapping("/variables")
    public List<VariableScadaConfig> obtenerTodasLasVariables() {
        return service.obtenerTodasLasVariables();
    }

    // 🔹 Obtiene todas las unidades de proceso
    @GetMapping("/unidades")
    public List<Unidad> obtenerTodasLasUnidades() {
        return service.obtenerTodasLasUnidades();
    }

    // 🔹 Obtiene todas las unidades de medida
    @GetMapping("/unidades-medida")
    public List<UnidadMedida> obtenerTodasLasUnidadesMedida() {
        return service.obtenerTodasLasUnidadesMedida();
    }

    // 🔹 Crea o actualiza una configuración de variable
    @PutMapping("/variables")
    public VariableScadaConfig guardarOActualizarVariable(@RequestBody VariableScadaConfig config, Principal principal) {
        String usuario = (principal != null) ? principal.getName() : "admin";
        return service.guardarOActualizarVariable(config, usuario);
    }

    // 🔹 Sincroniza las variables desde la Tabla_14
    @PostMapping("/variables/sync")
    public Map<String, Object> sincronizarVariables(Principal principal) {
        String usuario = (principal != null) ? principal.getName() : "admin";
        int total = service.sincronizarDesdeTabla14(usuario);
        return Map.of(
            "success", true,
            "message", "Se sincronizaron " + total + " variables desde Tabla_14.",
            "total", total
        );
    }

    // 🔹 Sincroniza las variables desde Node-RED
    @PostMapping("/variables/sync-node-red")
    public Map<String, Object> sincronizarNodeRed() {
        return nodeRedSyncService.sincronizarConfiguracion();
    }

    // 🔹 Crear o actualizar unidad de proceso
    @PostMapping("/unidades")
    public Unidad guardarUnidad(@RequestBody Unidad unidad, Principal principal) {
        String usuario = (principal != null) ? principal.getName() : "admin";
        return service.guardarOActualizarUnidad(unidad, usuario);
    }

    // 🔹 Crear o actualizar unidad de medida física
    @PostMapping("/unidades-medida")
    public UnidadMedida guardarUnidadMedida(@RequestBody UnidadMedida unidadMedida, Principal principal) {
        String usuario = (principal != null) ? principal.getName() : "admin";
        return service.guardarOActualizarUnidadMedida(unidadMedida, usuario);
    }

    // 🔹 Enviar alerta de correo cuando una variable entra o sale de límites
    @PostMapping("/variables/alerta")
    public Map<String, Object> enviarAlertaEmail(@RequestBody Map<String, Object> payload) {
        String tag = String.valueOf(payload.get("tag"));
        Double valor = Double.valueOf(String.valueOf(payload.get("valor")));
        String tipo = String.valueOf(payload.get("tipo")); // "fuera" o "dentro"
        String chartImage = (String) payload.get("chartImage");
        service.enviarAlertaEmail(tag, valor, tipo, chartImage);
        return Map.of("success", true, "message", "Alerta procesada.");
    }

    // 🔹 Obtener correos configurados para alertas PLC/SCADA
    @GetMapping("/receptores-plc")
    public Map<String, String> obtenerReceptoresPlc() {
        return Map.of("destinatarios", service.obtenerReceptoresPlcConfigurados());
    }

    // 🔹 Guardar correos configurados para alertas PLC/SCADA
    @PostMapping("/receptores-plc")
    public Map<String, Object> guardarReceptoresPlc(@RequestBody Map<String, String> payload) {
        String destinatarios = payload.get("destinatarios");
        service.guardarReceptoresPlc(destinatarios);
        return Map.of("success", true, "message", "Destinatarios actualizados correctamente.");
    }
}

