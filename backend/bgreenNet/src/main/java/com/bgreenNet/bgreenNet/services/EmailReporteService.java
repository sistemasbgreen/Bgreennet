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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class EmailReporteService {

    @Autowired private EmailReportesRepository repository;
    @Autowired private JavaMailSender          mailSender;

    @Value("${report.email.from}") private String emailFrom;
    @Value("${report.email.to}")   private String emailTo;

    private static final DateTimeFormatter FMT_DISPLAY = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * 0 = libre
     * 1 = disparado (pendiente de ejecutar)
     * 2 = en ejecución
     */
    private final AtomicInteger enviar = new AtomicInteger(0);
    
    
    public void dispararEnvioInmediato() {
        if (enviar.compareAndSet(0, 1)) {
            System.out.println("[EmailReporte] 🟡 Disparo inmediato → enviar=1");
            verificarYEnviar(); // ejecuta ahora mismo
        } else {
            System.out.println("[EmailReporte] ⚠️ Ya hay un envío en curso (estado=" + enviar.get() + ")");
        }
    }

    // ── Disparo manual ────────────────────────────────────────────────────
    public void dispararEnvioManual() {
        if (enviar.compareAndSet(0, 1)) {
            System.out.println("[EmailReporte] 🟡 Disparo manual → enviar=1");
        } else {
            System.out.println("[EmailReporte] ⚠️  Ya hay un envío pendiente o en curso (estado=" + enviar.get() + ")");
        }
    }

    // ── Scheduler: cada minuto verifica el flag; a las 11:00 AM dispara solo ──
    @Scheduled(cron = "0 * * * * *")
    public void verificarYEnviar() {

        // Disparo automático a las 11:00 AM
        LocalTime ahora = LocalTime.now();
        if (ahora.getHour() == 11 && ahora.getMinute() == 0) {
            enviar.compareAndSet(0, 1);
        }

        // Solo procede si estaba en 1; lo pasa a 2 atómicamente
        if (!enviar.compareAndSet(1, 2)) {
            return;
        }

        System.out.println("[EmailReporte] 🚀 enviar=2 → Procesando reporte...");

        try {
            ejecutarEnvio();
        } finally {
            enviar.set(0);
            System.out.println("[EmailReporte] 🔵 enviar=0 → Listo.");
        }
    }

    // ── Lógica de envío ───────────────────────────────────────────────────
    private void ejecutarEnvio() {
    //    LocalDate ayer        = LocalDate.now().minusDays(1);
    	DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    	LocalDate ayer = LocalDate.parse("08-04-2026", formatter);
        LocalDate fechaInicio = ayer;
        LocalDate fechaFin    = ayer.plusDays(1);

        System.out.println("[EmailReporte] Procesando fecha: " + ayer);

        ResumenCostosDTO resumen = repository.obtenerResumenCostos(fechaInicio, fechaFin);
        if (resumen == null) {
            System.err.println("[EmailReporte] ⚠️  Sin datos de costos para " + ayer);
            return;
        }

        List<DetalleInsumoDTO> detalles = repository.obtenerDetalleInsumos(fechaInicio, fechaFin);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(emailFrom);
            helper.setTo(emailTo);
            helper.setSubject("Reporte BGREEN SAS · " + ayer.format(FMT_DISPLAY));
            helper.setText(construirHtml(resumen, detalles, ayer), true);

            mailSender.send(message);
            System.out.println("[EmailReporte] ✅ Correo enviado correctamente.");

        } catch (MessagingException e) {
            System.err.println("[EmailReporte] ❌ Error enviando correo: " + e.getMessage());
        }
    }

    private String construirHtml(ResumenCostosDTO resumen,
            List<DetalleInsumoDTO> detalles,
            LocalDate fechaReporte) {

BigDecimal totalGlicerina = nvl(resumen.getTotalPurificacionGlicerina());
BigDecimal totalMod       = nvl(resumen.getTotalManoObra());
BigDecimal totalOtros     = nvl(resumen.getTotalOtrosCostos());
BigDecimal grandTotal     = totalGlicerina.add(totalMod).add(totalOtros);

// ── Conjuntos de items por grupo ──────────────────────────────────
java.util.Set<String> itemsBiodiesel = new java.util.HashSet<>(
java.util.Arrays.asList("8", "7309", "10", "13", "12", "26")
);
java.util.Set<String> itemsGlicerina = new java.util.HashSet<>(
java.util.Arrays.asList("34", "15", "2549", "32")
);

// ── Separar en dos listas ─────────────────────────────────────────
List<DetalleInsumoDTO> grupoB = new java.util.ArrayList<>();
List<DetalleInsumoDTO> grupoG = new java.util.ArrayList<>();

if (detalles != null) {
for (DetalleInsumoDTO det : detalles) {
String it = det.getItem() != null ? det.getItem().trim() : "";
if (itemsBiodiesel.contains(it))      grupoB.add(det);
else if (itemsGlicerina.contains(it)) grupoG.add(det);
}
}

StringBuilder sb = new StringBuilder();

// ── HEAD ──────────────────────────────────────────────────────────
sb.append("<!DOCTYPE html>")
.append("<html lang='es'><head><meta charset='UTF-8'>")
.append("<meta name='viewport' content='width=device-width,initial-scale=1'>")
.append("<title>Reporte BGREEN</title><style>")
.append("body{font-family:Segoe UI,Arial,sans-serif;background:#f0f4f0;margin:0;padding:20px;color:#333}")
.append(".wrap{max-width:680px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden}")
.append(".hdr{text-align:center;padding:22px 20px 16px;background:#fff;border-bottom:1px solid #e0e0e0}")
.append(".logo{width:52px;height:52px;background:#2e7d32;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;letter-spacing:1px}")
.append(".brand{font-size:15px;font-weight:700;color:#2e7d32;letter-spacing:1px;margin:4px 0 0}")
.append(".sub{font-size:11px;color:#888;margin:2px 0 0;text-transform:uppercase;letter-spacing:.5px}")
.append(".fecha{font-size:13px;color:#555;margin:6px 0 0}")
.append(".sec-hdr{background:#e8f5e9;padding:9px 18px;font-weight:700;font-size:12px;color:#1b5e20;text-transform:uppercase;letter-spacing:.5px;border-top:2px solid #a5d6a7}")
.append("table{width:100%;border-collapse:collapse;font-size:13px}")
.append("th{background:#f1f8e9;color:#33691e;font-size:11px;font-weight:600;text-transform:uppercase;padding:7px 18px;text-align:left;letter-spacing:.3px}")
.append("th.r{text-align:right}")
.append("td{padding:4px 18px;border-bottom:1px solid #f5f5f5;color:#444}")
.append("td.r{text-align:right;font-variant-numeric:tabular-nums;color:#2e7d32;font-weight:500}")
.append("tr:last-child td{border-bottom:none}")
.append(".res-wrap{padding:18px 18px 10px;border-top:2px solid #c8e6c9}")
.append(".res-title{font-size:13px;font-weight:700;color:#2e7d32;margin:0 0 10px}")
.append(".total-row td{background:#2e7d32 !important;color:#fff !important;font-weight:700;font-size:14px}")
.append(".ftr{text-align:center;padding:12px;font-size:11px;color:#aaa;background:#fafafa;border-top:1px solid #eee}")
.append("</style></head><body><div class='wrap'>")

// ── HEADER ────────────────────────────────────────────────────
.append("<div class='hdr'>")
.append("<img src='https://bgreen.com.co/Img/bgreen_Logo.png' width='50' height='50' style='object-fit:contain' alt='Bgreen'>")
.append("<p class='sub'>Reporte de Producci&oacute;n Diario</p>")
.append("<p class='fecha'>&#128197;&nbsp; ").append(fechaReporte.format(FMT_DISPLAY)).append("</p>")
.append("</div>");

//── BLOQUE BIODIESEL ──────────────────────────────────────────
sb.append("<div class='sec-hdr'>Biodiesel Destilado</div>");
sb.append(construirTablaGrupo(grupoB, resumen.getTotalOtrosCostos(), resumen.getTotalManoObra(), true));

//── BLOQUE GLICERINA ──────────────────────────────────────────
sb.append("<div class='sec-hdr'>Glicerina Cruda</div>");
sb.append(construirTablaGrupo(grupoG, resumen.getTotalPurificacionGlicerina(), null, false));





return sb.toString();
}

//── Tabla de insumos por grupo ────────────────────────────────────────────
private String construirTablaGrupo(List<DetalleInsumoDTO> items, BigDecimal otrosCostos, BigDecimal manoObra,
		boolean mostrarManoObra) {
	StringBuilder sb = new StringBuilder();
	sb.append("<table><thead><tr>").append("<th>Materia Prima / Insumo</th><th class='r'>Cantidad</th>")
			.append("</tr></thead><tbody>");

	for (DetalleInsumoDTO det : items) {
		String cant;
		if (det.getCantidadConsumida() != null) {
		    BigDecimal val = det.getCantidadConsumida().stripTrailingZeros();
		    int decimales = Math.max(0, val.scale());
		    cant = String.format("%,." + decimales + "f kg", det.getCantidadConsumida());
		} else {
		    cant = "—";
		}
		sb.append("<tr>").append("<td>").append(esc(det.getDescripcion())).append("</td>").append("<td class='r'>")
				.append(cant).append("</td>").append("</tr>");
	}

// Fila otros costos
	String valorOtros = otrosCostos != null ? "$ " + String.format("%,.2f", otrosCostos) : "$ 0";
	sb.append("<tr>")
	  .append("<td style='font-weight:700;color:#555'>Otros costos y gastos</td>")
	  .append("<td class='r' style='font-weight:700;color:#2e7d32'>").append(valorOtros).append("</td>")
	  .append("</tr>");

// Fila mano de obra (solo Biodiesel)
	if (mostrarManoObra) {
		String valorMod = manoObra != null ? "$ " + String.format("%,.2f", manoObra) : "$ 0";
		sb.append("<tr>")
		  .append("<td style='font-weight:700;color:#555'>Mano de obra</td>")
		  .append("<td class='r' style='font-weight:700;color:#2e7d32'>").append(valorMod).append("</td>")
		  .append("</tr>");
	}

	sb.append("</tbody></table>");
	return sb.toString();
}

    private String construirFilaInsumo(DetalleInsumoDTO det) {
        String fecha = det.getFecha() != null ? det.getFecha().format(FMT_DISPLAY) : "—";
        String cant  = det.getCantidadConsumida() != null
                       ? String.format("%,.4f", det.getCantidadConsumida()) : "—";
        return "<tr>"
             + "<td><span class='badge'>" + esc(det.getItem()) + "</span></td>"
             + "<td>" + esc(det.getDescripcion()) + "</td>"
             + "<td>" + fecha + "</td>"
             + "<td class='num'>" + cant + "</td>"
             + "</tr>";
    }

    private String construirFilaCosto(String etiqueta, BigDecimal valor, boolean esTotal) {
        String valorFmt = valor != null ? "$ " + String.format("%,.2f", valor) : "$ 0,00";
        return "<tr class='" + (esTotal ? "total-row" : "") + "'>"
             + "<td>" + esc(etiqueta) + "</td>"
             + "<td class='num'>" + valorFmt + "</td>"
             + "</tr>";
    }

    private String construirFilaCosto(String etiqueta, BigDecimal valor) {
        return construirFilaCosto(etiqueta, valor, false);
    }

    private BigDecimal nvl(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private String esc(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;")
                   .replace(">", "&gt;").replace("\"", "&quot;");
    }
    

}