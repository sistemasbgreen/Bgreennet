package com.bgreenNet.bgreenNet.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bgreenNet.bgreenNet.dto.CreateTareaRequest;
import com.bgreenNet.bgreenNet.dto.UpdateTareaRequest;
import com.bgreenNet.bgreenNet.models.EstadoTarea;
import com.bgreenNet.bgreenNet.models.PrioridadTarea;
import com.bgreenNet.bgreenNet.models.Tarea;
import com.bgreenNet.bgreenNet.models.TareaEstadoHistorial;
import com.bgreenNet.bgreenNet.models.TareaSeguimiento;
import com.bgreenNet.bgreenNet.models.Notificacion;
import com.bgreenNet.bgreenNet.models.Usuario;
import com.bgreenNet.bgreenNet.repository.EstadoTareaRepository;
import com.bgreenNet.bgreenNet.repository.NotificacionRepository;
import com.bgreenNet.bgreenNet.repository.PrioridadTareaRepository;
import com.bgreenNet.bgreenNet.repository.TareaEstadoHistorialRepository;
import com.bgreenNet.bgreenNet.repository.TareaRepository;
import com.bgreenNet.bgreenNet.repository.TareaSeguimientoRepository;
import com.bgreenNet.bgreenNet.repository.UsuarioRepository;
import java.time.Duration;
import java.util.Optional;

@Service
public class TareaService {

	private final PrioridadTareaRepository prioridadRepository;

	private final EstadoTareaRepository estadoRepository;
	private final TareaRepository tareaRepository;
	private final TareaSeguimientoRepository seguimientoRepository;
	private final TareaEstadoHistorialRepository historialRepository;
	private final UsuarioRepository usuarioRepository;
	private final NotificacionRepository notificacionRepository;

	public TareaService(EstadoTareaRepository estadoRepository, 
						TareaRepository tareaRepository, 
						PrioridadTareaRepository prioridadRepository,
						TareaSeguimientoRepository seguimientoRepository,
						TareaEstadoHistorialRepository historialRepository,
						UsuarioRepository usuarioRepository,
						NotificacionRepository notificacionRepository) {
		this.estadoRepository = estadoRepository;
		this.tareaRepository = tareaRepository;
		this.prioridadRepository = prioridadRepository;
		this.seguimientoRepository = seguimientoRepository;
		this.historialRepository = historialRepository;
		this.usuarioRepository = usuarioRepository;
		this.notificacionRepository = notificacionRepository;
	}

	public List<Tarea> obtenerPorUsuario(Integer idUsuario) {
		return tareaRepository.findByIdUsuarioOrIdUsuarioCreador(idUsuario, idUsuario);
	}

	@Transactional
	public List<Tarea> verificarNotificaciones(Integer idUsuario) {
		List<Tarea> tareasToNotify = tareaRepository.tareasParaNotificar(idUsuario);
		
		if (!tareasToNotify.isEmpty()) {
			LocalDateTime now = LocalDateTime.now();
			for (Tarea t : tareasToNotify) {
				t.setUltimaNotificacion(now);
			}
			tareaRepository.saveAll(tareasToNotify);
		}
		
		return tareasToNotify;
	}

	@Transactional
	public Tarea crear(CreateTareaRequest request) {

		EstadoTarea estado = estadoRepository.findById(request.getIdEstado())
				.orElseThrow(() -> new RuntimeException("Estado no existe"));

		PrioridadTarea prioridad = prioridadRepository.findById(request.getIdPrioridad())
				.orElseThrow(() -> new RuntimeException("Prioridad no existe"));

		Tarea tarea = new Tarea();
		tarea.setIdUsuario(request.getIdUsuario());
		tarea.setIdUsuarioCreador(request.getIdUsuarioCreador() != null ? request.getIdUsuarioCreador() : request.getIdUsuario());
		tarea.setTitulo(request.getTitulo());
		tarea.setDescripcion(request.getDescripcion());
		tarea.setEstado(estado);
		tarea.setPrioridad(prioridad);
		tarea.setFechaCreacion(LocalDateTime.now());
		tarea.setFechaLimite(request.getFechaLimite());

		Tarea saved = tareaRepository.save(tarea);
		
		// Registrar el estado inicial en el historial
		registrarCambioEstado(saved, null, estado);
		
		// Notificar al asignado si no es el creador
		if (!tarea.getIdUsuario().equals(tarea.getIdUsuarioCreador())) {
			crearNotificacion(tarea.getIdUsuario(), "Se te ha asignado una nueva tarea: " + tarea.getTitulo(), "NUEVA_TAREA", saved.getId());
		}
		
		return saved;
	}

	@Transactional
	public Tarea actualizar(Long idTarea, UpdateTareaRequest request) {

		Tarea tarea = tareaRepository.findById(idTarea).orElseThrow(() -> new RuntimeException("Tarea no encontrada"));

		if (request.getTitulo() != null) {
			tarea.setTitulo(request.getTitulo());
		}

		if (request.getDescripcion() != null) {
			tarea.setDescripcion(request.getDescripcion());
		}

		if (request.getIdEstado() != null) {
			EstadoTarea nuevoEstado = estadoRepository.findById(request.getIdEstado())
					.orElseThrow(() -> new RuntimeException("Estado no existe"));

			EstadoTarea estadoAnterior = tarea.getEstado();
			if (!nuevoEstado.getId().equals(estadoAnterior.getId())) {
				tarea.setEstado(nuevoEstado);
				
				// Registrar transición de estado
				registrarCambioEstado(tarea, estadoAnterior, nuevoEstado);

				// Si se inicia la tarea (deja de estar en estado CREADA)
				if (tarea.getFechaInicio() == null && !nuevoEstado.getId().equals(EstadoTarea.CREADA)) {
					tarea.setFechaInicio(LocalDateTime.now());
				}

				// Si se finaliza o cancela, se marca la fecha de completado
				if (nuevoEstado.getId() == EstadoTarea.FINALIZADA || nuevoEstado.getId() == EstadoTarea.CANCELADA) {
					tarea.setFechaCompletado(LocalDateTime.now());
					if (request.getNotaCierre() != null) {
						tarea.setNotaCierre(request.getNotaCierre());
					}
				}
			}
		}

		if (request.getIdPrioridad() != null) {
			PrioridadTarea prioridad = prioridadRepository.findById(request.getIdPrioridad())
					.orElseThrow(() -> new RuntimeException("Prioridad no existe"));

			tarea.setPrioridad(prioridad);
		}

		// Actualizar fecha límite
		if (request.getFechaLimite() != null) {
			tarea.setFechaLimite(request.getFechaLimite());
		} else if (Boolean.TRUE.equals(request.getClearFechaLimite())) {
			tarea.setFechaLimite(null);
		}

		return tareaRepository.save(tarea);
	}
	
	public Tarea obtenerPorId(Long id) {
	    return tareaRepository.findById(id)
	        .orElseThrow(() -> new RuntimeException("Tarea no encontrada"));
	}

	private void registrarCambioEstado(Tarea tarea, EstadoTarea anterior, EstadoTarea nuevo) {
		LocalDateTime now = LocalDateTime.now();
		
		// Cerrar estado anterior
		if (anterior != null) {
			Optional<TareaEstadoHistorial> ultimo = historialRepository.findFirstByTareaIdAndFechaFinIsNullOrderByFechaInicioDesc(tarea.getId());
			ultimo.ifPresent(h -> {
				h.setFechaFin(now);
				h.setDuracionSegundos(Duration.between(h.getFechaInicio(), now).getSeconds());
				historialRepository.save(h);
			});
		}
		
		// Abrir nuevo estado
		TareaEstadoHistorial nuevoHistorial = new TareaEstadoHistorial();
		nuevoHistorial.setTarea(tarea);
		nuevoHistorial.setEstado(nuevo);
		nuevoHistorial.setFechaInicio(now);
		historialRepository.save(nuevoHistorial);
	}

	// Metodos para seguimiento (Chat)
	public List<TareaSeguimiento> obtenerSeguimientos(Long idTarea) {
		return seguimientoRepository.findByTareaIdOrderByFechaAsc(idTarea);
	}

	@Transactional
	public TareaSeguimiento crearSeguimiento(Long idTarea, Integer idUsuario, String mensaje) {
		Tarea tarea = obtenerPorId(idTarea);
		Usuario usuario = usuarioRepository.findById(idUsuario)
				.orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
		
		TareaSeguimiento seguimiento = new TareaSeguimiento();
		seguimiento.setTarea(tarea);
		seguimiento.setUsuario(usuario);
		seguimiento.setMensaje(mensaje);
		seguimiento.setFecha(LocalDateTime.now());
		
		TareaSeguimiento saved = seguimientoRepository.save(seguimiento);
		
		// Notificar a la "otra" persona
		Integer destinatarioId = idUsuario.equals(tarea.getIdUsuario()) ? tarea.getIdUsuarioCreador() : tarea.getIdUsuario();
		if (destinatarioId != null && !destinatarioId.equals(idUsuario)) {
			crearNotificacion(destinatarioId, "Nuevo mensaje en la tarea: " + tarea.getTitulo(), "NUEVO_MENSAJE", tarea.getId());
		}

		return saved;
	}

	private void crearNotificacion(Integer idUsuario, String mensaje, String tipo, Long referenciaId) {
		Usuario usuario = usuarioRepository.findById(idUsuario).orElse(null);
		if (usuario != null) {
			Notificacion notif = new Notificacion();
			notif.setUsuario(usuario);
			notif.setMensaje(mensaje);
			notif.setTipo(tipo);
			notif.setReferenciaId(referenciaId);
			notificacionRepository.save(notif);
		}
	}

	public List<Notificacion> obtenerNotificacionesUsuario(Integer idUsuario) {
		return notificacionRepository.findByUsuarioIdUsuarioAndLeidoFalseOrderByFechaDesc(idUsuario);
	}

	@Transactional
	public void marcarNotificacionComoLeida(Long idNotificacion) {
		notificacionRepository.findById(idNotificacion).ifPresent(n -> {
			n.setLeido(true);
			notificacionRepository.save(n);
		});
	}

}
