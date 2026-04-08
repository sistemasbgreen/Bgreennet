// services/EmailReporteService.java
package com.bgreenNet.bgreenNet.services;

import com.bgreenNet.bgreenNet.dto.DetalleInsumoDTO;
import com.bgreenNet.bgreenNet.dto.ResumenCostosDTO;
import com.bgreenNet.bgreenNet.repository.EmailReportesRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class EmailReporteService {

    @Autowired private EmailReportesRepository repository;
    @Autowired private JavaMailSender          mailSender;

    @Value("${report.email.from}") private String emailFrom;
    @Value("${report.email.to}")   private String emailTo;

    // ── Todos los días a las 11:00 AM ─────────────────────────────────────
    @Scheduled(cron = "0 0 11 * * *")
    public void enviarReporte() {

        LocalDate ayer       = LocalDate.now().minusDays(1);
        LocalDate fechaInicio = ayer;
        LocalDate fechaFin    = ayer.plusDays(1);

        System.out.println("[EmailReporte] Ejecutando envío programado para fecha: " + ayer);

        ResumenCostosDTO resumen = repository.obtenerResumenCostos(fechaInicio, fechaFin);
        if (resumen == null) {
            System.err.println("[EmailReporte] Sin costos para " + fechaInicio + " – " + fechaFin);
            return;
        }

        List<DetalleInsumoDTO> detalles = repository.obtenerDetalleInsumos(fechaInicio, fechaFin);

        try {
            String htmlContent = construirHtml(resumen, detalles, ayer);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(emailFrom);
            helper.setTo(emailTo);
            helper.setSubject("Reporte BGREEN SAS · "
                    + ayer.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("[EmailReporte] ✅ Correo enviado correctamente.");

        } catch (MessagingException e) {
            System.err.println("[EmailReporte] ❌ Error enviando correo: " + e.getMessage());
        }
    }

    // ── HTML ──────────────────────────────────────────────────────────────
    private String construirHtml(ResumenCostosDTO resumen,
                                  List<DetalleInsumoDTO> detalles,
                                  LocalDate fechaReporte) {
        // ... tu implementación existente sin cambios ...
        return "";
    }

    private String construirFilaInsumo(DetalleInsumoDTO det) { /* igual */ return ""; }
    private String construirFilaCosto(String e, java.math.BigDecimal v, boolean s) { /* igual */ return ""; }
    private String construirFilaCosto(String e, java.math.BigDecimal v) { return construirFilaCosto(e, v, false); }
}