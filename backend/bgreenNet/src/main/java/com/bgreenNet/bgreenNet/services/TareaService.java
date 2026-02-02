package com.bgreenNet.bgreenNet.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.dto.CreateTareaRequest;
import com.bgreenNet.bgreenNet.dto.UpdateTareaRequest;
import com.bgreenNet.bgreenNet.models.EstadoTarea;
import com.bgreenNet.bgreenNet.models.PrioridadTarea;
import com.bgreenNet.bgreenNet.models.Tarea;
import com.bgreenNet.bgreenNet.repository.EstadoTareaRepository;
import com.bgreenNet.bgreenNet.repository.PrioridadTareaRepository;
import com.bgreenNet.bgreenNet.repository.TareaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class TareaService {

	private final PrioridadTareaRepository prioridadRepository;

	private final EstadoTareaRepository estadoRepository;
	private final TareaRepository tareaRepository;

	public TareaService(EstadoTareaRepository estadoRepository, TareaRepository tareaRepository , PrioridadTareaRepository prioridadRepository ) {
		this.estadoRepository = estadoRepository;
		this.tareaRepository = tareaRepository;
		this.prioridadRepository = prioridadRepository;
	}

	public List<Tarea> obtenerPorUsuario(Integer idUsuario) {
		return tareaRepository.findByIdUsuario(idUsuario);
	}

	public Tarea crear(CreateTareaRequest request) {

		EstadoTarea estado = estadoRepository.findById(request.getIdEstado())
				.orElseThrow(() -> new RuntimeException("Estado no existe"));

		PrioridadTarea prioridad = prioridadRepository.findById(request.getIdPrioridad())
				.orElseThrow(() -> new RuntimeException("Prioridad no existe"));

		Tarea tarea = new Tarea();
		tarea.setIdUsuario(request.getIdUsuario());
		tarea.setTitulo(request.getTitulo());
		tarea.setDescripcion(request.getDescripcion());
		tarea.setEstado(estado);
		tarea.setPrioridad(prioridad);
		tarea.setFechaCreacion(LocalDateTime.now());

		return tareaRepository.save(tarea);
	}

	public Tarea actualizar(Long idTarea, UpdateTareaRequest request) {

		Tarea tarea = tareaRepository.findById(idTarea).orElseThrow(() -> new RuntimeException("Tarea no encontrada"));

		if (request.getTitulo() != null) {
			tarea.setTitulo(request.getTitulo());
		}

		if (request.getDescripcion() != null) {
			tarea.setDescripcion(request.getDescripcion());
		}

		if (request.getIdEstado() != null) {
			EstadoTarea estado = estadoRepository.findById(request.getIdEstado())
					.orElseThrow(() -> new RuntimeException("Estado no existe"));

			tarea.setEstado(estado);

			// Si se finaliza la tarea, se marca la fecha
			if ("FINALIZADA".equalsIgnoreCase(estado.getNombre())) {
				tarea.setFechaCompletado(LocalDateTime.now());
			}
		}

		if (request.getIdPrioridad() != null) {
			PrioridadTarea prioridad = prioridadRepository.findById(request.getIdPrioridad())
					.orElseThrow(() -> new RuntimeException("Prioridad no existe"));

			tarea.setPrioridad(prioridad);
		}

		return tareaRepository.save(tarea);
	}
	
	public Tarea obtenerPorId(Long id) {
	    return tareaRepository.findById(id)
	        .orElseThrow(() -> new RuntimeException("Tarea no encontrada"));
	}

}
