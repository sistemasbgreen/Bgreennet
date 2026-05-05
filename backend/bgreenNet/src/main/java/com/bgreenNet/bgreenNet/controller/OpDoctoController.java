package com.bgreenNet.bgreenNet.controller;

import java.util.List;
import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.dto.OpDoctoDTO;
import com.bgreenNet.bgreenNet.repository.OpDoctoRepository;



@RestController
@RequestMapping("/api/op-docto")
@CrossOrigin(origins = "*") 


public class OpDoctoController {

	 @Autowired
	    private OpDoctoRepository repository;

	 @Autowired
	    private com.bgreenNet.bgreenNet.services.EmailReporteService emailService;

	    @GetMapping
	    public ResponseEntity<List<OpDoctoDTO>> listarDocumentos() {
	        List<OpDoctoDTO> documentos = repository.findAll();
	        return ResponseEntity.ok(documentos);
	    }

		@GetMapping("/por-fechas")
		public ResponseEntity<List<OpDoctoDTO>> listarPorFechas(
				@RequestParam String fechaInicio,
				@RequestParam String fechaFin) {
			try {
				LocalDate inicio = LocalDate.parse(fechaInicio);
				LocalDate fin    = LocalDate.parse(fechaFin);
				if (fin.isBefore(inicio)) {
					return ResponseEntity.badRequest().body(null);
				}
				List<OpDoctoDTO> documentos = repository.findByRangoFechas(inicio, fin);
				return ResponseEntity.ok(documentos);
			} catch (Exception e) {
				return ResponseEntity.status(500).body(null);
			}
		}

		@GetMapping("/receptores")
		public ResponseEntity<String> obtenerReceptores() {
			return ResponseEntity.ok(emailService.obtenerReceptoresConfigurados());
		}

		@org.springframework.web.bind.annotation.PutMapping(value = "/receptores", consumes = "text/plain;charset=UTF-8")
		public ResponseEntity<String> actualizarReceptores(
				@org.springframework.web.bind.annotation.RequestBody String nuevosDestinatarios) {
			try {
				emailService.guardarReceptores(nuevosDestinatarios.trim());
				return ResponseEntity.ok("Receptores actualizados");
			} catch (Exception e) {
				return ResponseEntity.status(500).body("Error al guardar receptores: " + e.getMessage());
			}
		}

		@org.springframework.web.bind.annotation.GetMapping("/datos-erp")
		public ResponseEntity<java.util.List<com.bgreenNet.bgreenNet.dto.ItemErpDTO>> obtenerDatosERP(@org.springframework.web.bind.annotation.RequestParam String fecha) {
			try {
				java.time.LocalDate ref = java.time.LocalDate.parse(fecha.substring(0, 10));
				com.bgreenNet.bgreenNet.dto.ReporteProduccionDTO datos = emailService.obtenerDatosReporte(ref, ref.plusDays(1));
				
				java.util.List<com.bgreenNet.bgreenNet.dto.ItemErpDTO> itemsErp = new java.util.ArrayList<>();
				
				// Combinar Biodiesel y Glicerina en una sola lista para el ERP
				java.util.List<com.bgreenNet.bgreenNet.dto.DetalleInsumoDTO> todos = new java.util.ArrayList<>();
				if (datos.getItemsBiodiesel() != null) todos.addAll(datos.getItemsBiodiesel());
				if (datos.getItemsGlicerina() != null) todos.addAll(datos.getItemsGlicerina());
				
				java.util.Map<String, String> mapeoErp = new java.util.HashMap<>();
				mapeoErp.put("8", "2658");
				mapeoErp.put("7309", "6258");
				mapeoErp.put("10", "2804");
				mapeoErp.put("13", "3340");
				mapeoErp.put("12", "2756");
				mapeoErp.put("26", "5315");
				mapeoErp.put("34", "2930");
				mapeoErp.put("15", "2693");
				mapeoErp.put("2549", "2762");
				mapeoErp.put("32", "5378");
				mapeoErp.put("3188", "5320");

				for (com.bgreenNet.bgreenNet.dto.DetalleInsumoDTO det : todos) {
					com.bgreenNet.bgreenNet.dto.ItemErpDTO item = new com.bgreenNet.bgreenNet.dto.ItemErpDTO();
					
					String idInterno = det.getItem() != null ? det.getItem().trim() : "";
					String idErp = mapeoErp.getOrDefault(idInterno, idInterno);
					
					item.setMatnr(idErp); // Usar ID mapeado para MATNR
					item.setMaktx(det.getDescripcion());
					
					java.math.BigDecimal cant = det.getCantidadConsumida() != null ? det.getCantidadConsumida() : java.math.BigDecimal.ZERO;
					item.setMenge(String.format("%.3f", cant));
					
					itemsErp.add(item);
				}
				
				return ResponseEntity.ok(itemsErp);
			} catch (Exception e) {
				return ResponseEntity.status(500).body(null);
			}
		}

		@org.springframework.web.bind.annotation.PostMapping("/enviar-reporte")
		public ResponseEntity<String> enviarReporte(@org.springframework.web.bind.annotation.RequestBody java.util.Map<String, String> payload) {
			try {
				String fecha = payload.get("fecha");
				if (fecha == null || fecha.isEmpty()) {
					return ResponseEntity.badRequest().body("Falta el parámetro 'fecha'");
				}
				emailService.enviarReporteParaFecha(fecha);
				return ResponseEntity.ok("Reporte enviado correctamente");
			} catch (Exception e) {
				return ResponseEntity.status(500).body("Error al enviar el reporte: " + e.getMessage());
			}
		}
}
