package com.bgreenNet.bgreenNet.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.dto.CreateTareaRequest;
import com.bgreenNet.bgreenNet.dto.UpdateTareaRequest;
import com.bgreenNet.bgreenNet.models.Tarea;
import com.bgreenNet.bgreenNet.services.TareaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tareas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")

public class TareaController {

	private final TareaService tareaService;

    public TareaController(TareaService tareaService) {
        this.tareaService = tareaService;
    }
    
	@PostMapping("/crear")
	public ResponseEntity<Tarea> crear(@RequestBody CreateTareaRequest request) {
		Tarea tareaCreada = tareaService.crear(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(tareaCreada);
	}

	@PutMapping("/{id}")
	public ResponseEntity<Tarea> actualizar(@PathVariable Long id, @RequestBody UpdateTareaRequest request) {

		Tarea tareaActualizada = tareaService.actualizar(id, request);
		return ResponseEntity.ok(tareaActualizada);
	}
	
	@GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<Tarea>> obtenerPorUsuario(@PathVariable Integer idUsuario) {
        return ResponseEntity.ok(tareaService.obtenerPorUsuario(idUsuario));
    }

}
