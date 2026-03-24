package com.bgreenNet.bgreenNet.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.bgreenNet.bgreenNet.repository.PulsoRepository;

/**
 * Scheduler que activa automáticamente los pulsos cuya fecha_Activacion
 * ya llegó y que aún están inactivos. Se ejecuta a medianoche cada día.
 */
@Component
public class PulsoScheduler {

    private static final Logger log = LoggerFactory.getLogger(PulsoScheduler.class);

    private final PulsoRepository pulsoRepository;

    @Autowired
    public PulsoScheduler(PulsoRepository pulsoRepository) {
        this.pulsoRepository = pulsoRepository;
    }

    /**
     * Cron: "0 0 0 * * *" = cada día a las 00:00:00
     * Cambia a "0 * * * * *" para pruebas (cada minuto).
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void activarPulsosPorFecha() {
        log.info("==> [PulsoScheduler] Ejecutando activación automática de pulsos por fecha...");
        try {
            pulsoRepository.activarPulsosPorFecha();
            log.info("==> [PulsoScheduler] Activación completada correctamente.");
        } catch (Exception e) {
            log.error("==> [PulsoScheduler] Error al activar pulsos: {}", e.getMessage(), e);
        }
    }
}
