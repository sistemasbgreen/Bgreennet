package com.bgreenNet.bgreenNet.controllers;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/metrics")
public class MetricsController {

    @Autowired
    private MeterRegistry meterRegistry;

    private final RestTemplate restTemplate = new RestTemplate();
    private final String NODE_RED_URL = "http://172.30.72.143:1880/flows";

    @GetMapping("/current")
    public Map<String, Object> getCurrentMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        // 1. Métricas de Base de Datos (HikariCP)
        Map<String, Double> dbMetrics = new HashMap<>();
        try {
            dbMetrics.put("active", meterRegistry.get("hikaricp.connections.active").gauge().value());
            dbMetrics.put("idle", meterRegistry.get("hikaricp.connections.idle").gauge().value());
            dbMetrics.put("total", meterRegistry.get("hikaricp.connections").gauge().value());
            dbMetrics.put("max", meterRegistry.get("hikaricp.connections.max").gauge().value());
        } catch (Exception e) {
            // Si Hikari no está configurado para exportar métricas, enviamos 0
            dbMetrics.put("active", 0.0);
            dbMetrics.put("idle", 0.0);
            dbMetrics.put("total", 0.0);
            dbMetrics.put("max", 0.0);
        }
        metrics.put("db", dbMetrics);

        // 2. Métricas de Peticiones HTTP
        Map<String, Object> httpMetrics = new HashMap<>();
        try {
            Timer httpTimer = meterRegistry.get("http.server.requests").timer();
            httpMetrics.put("count", httpTimer.count());
            httpMetrics.put("totalTimeSecs", httpTimer.totalTime(TimeUnit.SECONDS));
        } catch (Exception e) {
            httpMetrics.put("count", 0L);
            httpMetrics.put("totalTimeSecs", 0.0);
        }
        metrics.put("http", httpMetrics);

        // 3. Conexión a PLCs / Node-RED
        Map<String, Object> nodeRedMetrics = new HashMap<>();
        long startTime = System.currentTimeMillis();
        try {
            restTemplate.getForObject(NODE_RED_URL, String.class);
            long latency = System.currentTimeMillis() - startTime;
            nodeRedMetrics.put("status", "UP");
            nodeRedMetrics.put("latencyMs", latency);
        } catch (Exception e) {
            nodeRedMetrics.put("status", "DOWN");
            nodeRedMetrics.put("latencyMs", -1);
        }
        metrics.put("nodered", nodeRedMetrics);

        metrics.put("timestamp", System.currentTimeMillis());

        return metrics;
    }
}
