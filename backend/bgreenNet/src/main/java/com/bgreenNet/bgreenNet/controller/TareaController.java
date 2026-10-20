package com.bgreenNet.bgreenNet.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.dto.CreateSubtareaRequest;
import com.bgreenNet.bgreenNet.dto.CreateTareaRequest;
import com.bgreenNet.bgreenNet.dto.SeguimientoRequest;
import com.bgreenNet.bgreenNet.dto.UpdateTareaRequest;
import com.bgreenNet.bgreenNet.models.Notificacion;
import com.bgreenNet.bgreenNet.models.Subtarea;
import com.bgreenNet.bgreenNet.models.Tarea;
import com.bgreenNet.bgreenNet.models.TareaSeguimiento;
import com.bgreenNet.bgreenNet.services.TareaService;

@RestController
@RequestMapping({"/api/tareas", "/tareas"})
@CrossOrigin(origins = "*")
public class TareaController {

	private final TareaService tareaService;

	public TareaController(TareaService tareaService) {
		this.tareaService = tareaService;
	}

	@PostMapping({"", "/", "/crear"})
	public ResponseEntity<?> crear(@RequestBody CreateTareaRequest request) {
		try {
			Tarea tareaCreada = tareaService.crear(request);
			return ResponseEntity.status(HttpStatus.CREATED).body(tareaCreada);
		} catch (IllegalArgumentException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", e.getMessage()));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Map.of("message", e.getMessage()));
		}
	}

	@GetMapping("/crear")
	public ResponseEntity<String> getCrearInfo() {
		return ResponseEntity.ok("Endpoint de creación de tareas. Utilice método POST para crear una tarea.");
	}

	@PutMapping("/{id:[0-9]+}")
	public ResponseEntity<Tarea> actualizar(@PathVariable Long id, @RequestBody UpdateTareaRequest request) {
		Tarea tareaActualizada = tareaService.actualizar(id, request);
		return ResponseEntity.ok(tareaActualizada);
	}

	@GetMapping("/{id:[0-9]+}")
	public ResponseEntity<Tarea> obtenerPorId(@PathVariable Long id) {
		return ResponseEntity.ok(tareaService.obtenerPorId(id));
	}

	@GetMapping("/usuario/{idUsuario:[0-9]+}")
	public ResponseEntity<List<Tarea>> obtenerPorUsuario(@PathVariable Integer idUsuario) {
		return ResponseEntity.ok(tareaService.obtenerPorUsuario(idUsuario));
	}

	@GetMapping("/notificaciones/{idUsuario:[0-9]+}")
	public ResponseEntity<List<Tarea>> obtenerNotificaciones(@PathVariable Integer idUsuario) {
		return ResponseEntity.ok(tareaService.verificarNotificaciones(idUsuario));
	}

	@GetMapping("/{id:[0-9]+}/seguimiento")
	public ResponseEntity<List<TareaSeguimiento>> obtenerSeguimientos(@PathVariable Long id) {
		return ResponseEntity.ok(tareaService.obtenerSeguimientos(id));
	}

	@PostMapping("/{id:[0-9]+}/seguimiento/{idUsuario:[0-9]+}")
	public ResponseEntity<TareaSeguimiento> crearSeguimiento(@PathVariable Long id, @PathVariable Integer idUsuario, @RequestBody SeguimientoRequest request) {
		return ResponseEntity.ok(tareaService.crearSeguimiento(id, idUsuario, request.getMensaje()));
	}

	@GetMapping("/notificaciones/activas/{idUsuario:[0-9]+}")
	public ResponseEntity<List<Notificacion>> getNotificacionesActivas(@PathVariable Integer idUsuario) {
		return ResponseEntity.ok(tareaService.obtenerNotificacionesUsuario(idUsuario));
	}

	@PutMapping("/notificaciones/{id:[0-9]+}/leido")
	public ResponseEntity<Void> marcarNotificacionLeida(@PathVariable Long id) {
		tareaService.marcarNotificacionComoLeida(id);
		return ResponseEntity.ok().build();
	}

	// ==========================================
	// ENDPOINTS SUBTAREAS
	// ==========================================

	@GetMapping("/{id:[0-9]+}/subtareas")
	public ResponseEntity<List<Subtarea>> obtenerSubtareas(@PathVariable Long id) {
		return ResponseEntity.ok(tareaService.obtenerSubtareas(id));
	}

	@PostMapping("/{id:[0-9]+}/subtareas")
	public ResponseEntity<Subtarea> agregarSubtarea(@PathVariable Long id, @RequestBody CreateSubtareaRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(tareaService.agregarSubtarea(id, request));
	}

	@PutMapping("/subtareas/{idSubtarea:[0-9]+}/toggle")
	public ResponseEntity<Subtarea> alternarSubtarea(@PathVariable Long idSubtarea) {
		return ResponseEntity.ok(tareaService.alternarSubtarea(idSubtarea));
	}

	@PutMapping("/subtareas/{idSubtarea:[0-9]+}")
	public ResponseEntity<Subtarea> actualizarSubtarea(@PathVariable Long idSubtarea, @RequestBody CreateSubtareaRequest request) {
		return ResponseEntity.ok(tareaService.actualizarSubtarea(idSubtarea, request));
	}

	@DeleteMapping("/subtareas/{idSubtarea:[0-9]+}")
	public ResponseEntity<Void> eliminarSubtarea(@PathVariable Long idSubtarea) {
		tareaService.eliminarSubtarea(idSubtarea);
		return ResponseEntity.noContent().build();
	}

}
