package com.bgreenNet.bgreenNet.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.bgreenNet.bgreenNet.services.VariablesScadaService;

@Component
public class PlcScadaScheduler {

    private static final Logger logger = LoggerFactory.getLogger(PlcScadaScheduler.class);

    @Autowired
    private VariablesScadaService variablesScadaService;

    /**
     * Reporte diario de variables PLC / SCADA a las 6:00 AM (hora Colombia).
     * Evalúa el periodo de 6:00:00 AM del día anterior hasta las 5:59:59 AM del día actual.
     */
    @Scheduled(cron = "0 0 6 * * *", zone = "America/Bogota")
    public void enviarReporteDiario6am() {
        logger.info("[CRON] Iniciando generación y envío automático del reporte diario SCADA (6:00 AM)...");
        try {
            variablesScadaService.generarYEnviarReporteDiario(null);
            logger.info("[CRON] Reporte diario SCADA procesado exitosamente.");
        } catch (Exception e) {
            logger.error("[CRON] Error al generar reporte diario SCADA a las 6:00 AM: {}", e.getMessage(), e);
        }
    }
}
