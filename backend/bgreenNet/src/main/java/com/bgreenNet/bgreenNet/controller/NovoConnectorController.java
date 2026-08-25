package com.bgreenNet.bgreenNet.controller;

import com.bgreenNet.bgreenNet.models.NovoHistory;
import com.bgreenNet.bgreenNet.models.NovoPoint;
import com.bgreenNet.bgreenNet.models.NovoRule;
import com.bgreenNet.bgreenNet.services.NovoIntegrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/novo")
public class NovoConnectorController {

    private static final Logger logger = LoggerFactory.getLogger(NovoConnectorController.class);

    private final NovoIntegrationService integrationService;

    @Autowired
    public NovoConnectorController(NovoIntegrationService integrationService) {
        this.integrationService = integrationService;
    }

    /**
     * Endpoint para sincronizar las reglas de usuario desde NOVO y guardarlas en base de datos.
     * GET http://localhost:8081/api/novo/rules/sync
     */
    @PostMapping("/rules/sync")
    public ResponseEntity<List<NovoRule>> syncUserRules() {
        logger.info("Solicitud REST recibida para sincronizar reglas de usuario.");
        List<NovoRule> rules = integrationService.fetchAndSaveUserRules();
        return ResponseEntity.ok(rules);
    }

    /**
     * Endpoint para sincronizar históricos de una regla específica.
     * POST http://localhost:8081/api/novo/history/sync?ruleId=34&start=2026-08-24T00:00:00&end=2026-08-24T23:59:59
     */
    @PostMapping("/history/sync")
    public ResponseEntity<List<NovoHistory>> syncHistory(
            @RequestParam Long ruleId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        
        logger.info("Solicitud REST recibida para sincronizar históricos. RuleId: {}, Rango: {} - {}", ruleId, start, end);
        List<NovoHistory> histories = integrationService.fetchAndSaveRuleHistory(ruleId, start, end);
        return ResponseEntity.ok(histories);
    }

    /**
     * Endpoint para sincronizar los valores actuales de los puntos de una regla.
     * POST http://localhost:8081/api/novo/points/sync?ruleId=36
     */
    @PostMapping("/points/sync")
    public ResponseEntity<List<NovoPoint>> syncPoints(@RequestParam Long ruleId) {
        logger.info("Solicitud REST recibida para sincronizar valores actuales de puntos. RuleId: {}", ruleId);
        List<NovoPoint> points = integrationService.fetchAndSavePointRuleData(ruleId);
        return ResponseEntity.ok(points);
    }
}
