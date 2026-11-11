package com.bgreenNet.bgreenNet.services;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bgreenNet.bgreenNet.dto.CreateSubtareaRequest;
import com.bgreenNet.bgreenNet.dto.CreateTareaRequest;
import com.bgreenNet.bgreenNet.dto.UpdateTareaRequest;
import com.bgreenNet.bgreenNet.models.EstadoTarea;
import com.bgreenNet.bgreenNet.models.Notificacion;
import com.bgreenNet.bgreenNet.models.PrioridadTarea;
import com.bgreenNet.bgreenNet.models.Subtarea;
import com.bgreenNet.bgreenNet.models.Tarea;
import com.bgreenNet.bgreenNet.models.TareaEstadoHistorial;
import com.bgreenNet.bgreenNet.models.TareaSeguimiento;
import com.bgreenNet.bgreenNet.models.Usuario;
import com.bgreenNet.bgreenNet.repository.EstadoTareaRepository;
import com.bgreenNet.bgreenNet.repository.NotificacionRepository;
import com.bgreenNet.bgreenNet.repository.PrioridadTareaRepository;
import com.bgreenNet.bgreenNet.repository.SubtareaRepository;
import com.bgreenNet.bgreenNet.repository.TareaEstadoHistorialRepository;
import com.bgreenNet.bgreenNet.repository.TareaRepository;
import com.bgreenNet.bgreenNet.repository.TareaSeguimientoRepository;
import com.bgreenNet.bgreenNet.repository.UsuarioRepository;

@Service
public class TareaService {

	private final PrioridadTareaRepository prioridadRepository;
	private final EstadoTareaRepository estadoRepository;
	private final TareaRepository tareaRepository;
	private final TareaSeguimientoRepository seguimientoRepository;
	private final TareaEstadoHistorialRepository historialRepository;
	private final UsuarioRepository usuarioRepository;
	private final NotificacionRepository notificacionRepository;
	private final SubtareaRepository subtareaRepository;

	public TareaService(EstadoTareaRepository estadoRepository, 
						TareaRepository tareaRepository, 
						PrioridadTareaRepository prioridadRepository,
						TareaSeguimientoRepository seguimientoRepository,
						TareaEstadoHistorialRepository historialRepository,
						UsuarioRepository usuarioRepository,
						NotificacionRepository notificacionRepository,
						SubtareaRepository subtareaRepository) {
		this.estadoRepository = estadoRepository;
		this.tareaRepository = tareaRepository;
		this.prioridadRepository = prioridadRepository;
		this.seguimientoRepository = seguimientoRepository;
		this.historialRepository = historialRepository;
		this.usuarioRepository = usuarioRepository;
		this.notificacionRepository = notificacionRepository;
		this.subtareaRepository = subtareaRepository;
	}

	public List<Tarea> obtenerPorUsuario(Integer idUsuario) {
		return tareaRepository.findTareasParaUsuario(idUsuario);
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
		if (request.getIdUsuario() == null || request.getIdUsuario() <= 0) {
			throw new IllegalArgumentException("Debe asignar un usuario válido a la tarea.");
		}
		if (!usuarioRepository.existsById(request.getIdUsuario())) {
			throw new IllegalArgumentException("El usuario asignado con ID (" + request.getIdUsuario() + ") no existe en la base de datos.");
		}

		Integer idCreador = request.getIdUsuarioCreador();
		if (idCreador == null || idCreador <= 0 || !usuarioRepository.existsById(idCreador)) {
			idCreador = request.getIdUsuario();
		}

		EstadoTarea estado = estadoRepository.findById(request.getIdEstado())
				.orElseThrow(() -> new RuntimeException("Estado no existe"));

		PrioridadTarea prioridad = prioridadRepository.findById(request.getIdPrioridad())
				.orElseThrow(() -> new RuntimeException("Prioridad no existe"));

		Tarea tarea = new Tarea();
		tarea.setIdUsuario(request.getIdUsuario());
		tarea.setIdUsuarioCreador(idCreador);
		tarea.setTitulo(request.getTitulo());
		tarea.setDescripcion(request.getDescripcion());
		tarea.setEstado(estado);
		tarea.setPrioridad(prioridad);
		tarea.setFechaCreacion(LocalDateTime.now());
		tarea.setFechaLimite(request.getFechaLimite());

		Tarea saved = tareaRepository.save(tarea);
		
		// Registrar el estado inicial en el historial
		registrarCambioEstado(saved, null, estado);
		
		// Guardar subtareas si existen
		Set<Integer> usuariosConSubtarea = new HashSet<>();
		if (request.getSubtareas() != null && !request.getSubtareas().isEmpty()) {
			for (CreateSubtareaRequest subReq : request.getSubtareas()) {
				if (subReq.getTitulo() != null && !subReq.getTitulo().trim().isEmpty()) {
					Subtarea sub = new Subtarea();
					sub.setTarea(saved);
					sub.setTitulo(subReq.getTitulo().trim());
					Integer asignado = subReq.getIdUsuario();
					if (asignado == null || asignado <= 0 || !usuarioRepository.existsById(asignado)) {
						asignado = saved.getIdUsuario();
					}
					sub.setIdUsuario(asignado);
					sub.setCompletada(false);
					sub.setFechaCreacion(LocalDateTime.now());
					subtareaRepository.save(sub);
					usuariosConSubtarea.add(asignado);

					// Notificar al asignado de la subtarea si es diferente al creador
					if (asignado != null && !asignado.equals(saved.getIdUsuarioCreador())) {
						crearNotificacion(asignado, "Se te ha asignado la subtarea: " + sub.getTitulo() + " en la tarea: " + saved.getTitulo(), "NUEVA_SUBTAREA", saved.getId());
					}
				}
			}
		}

		// Asignar y vincular usuarios adicionales si se seleccionaron varios
		if (request.getIdUsuariosAsignados() != null) {
			for (Integer uId : request.getIdUsuariosAsignados()) {
				if (uId != null && uId > 0 && !uId.equals(saved.getIdUsuario()) && usuarioRepository.existsById(uId)) {
					if (!usuariosConSubtarea.contains(uId)) {
						Subtarea subPart = new Subtarea();
						subPart.setTarea(saved);
						subPart.setTitulo("Colaboración en: " + saved.getTitulo());
						subPart.setIdUsuario(uId);
						subPart.setCompletada(false);
						subPart.setFechaCreacion(LocalDateTime.now());
						subtareaRepository.save(subPart);
						usuariosConSubtarea.add(uId);

						if (!uId.equals(saved.getIdUsuarioCreador())) {
							crearNotificacion(uId, "Se te ha asignado a la tarea: " + saved.getTitulo(), "NUEVA_TAREA", saved.getId());
						}
					}
				}
			}
		}

		// Notificar al asignado principal si no es el creador
		if (!tarea.getIdUsuario().equals(tarea.getIdUsuarioCreador())) {
			crearNotificacion(tarea.getIdUsuario(), "Se te ha asignado una nueva tarea: " + tarea.getTitulo(), "NUEVA_TAREA", saved.getId());
		}
		
		return obtenerPorId(saved.getId());
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

	// ==========================================
	// GESTIÓN DE SUBTAREAS
	// ==========================================
	public List<Subtarea> obtenerSubtareas(Long idTarea) {
		return subtareaRepository.findByTareaIdOrderByIdAsc(idTarea);
	}

	@Transactional
	public Subtarea agregarSubtarea(Long idTarea, CreateSubtareaRequest request) {
		Tarea tarea = obtenerPorId(idTarea);

		Subtarea sub = new Subtarea();
		sub.setTarea(tarea);
		sub.setTitulo(request.getTitulo().trim());
		Integer asignado = request.getIdUsuario();
		if (asignado == null || asignado <= 0 || !usuarioRepository.existsById(asignado)) {
			asignado = tarea.getIdUsuario();
		}
		sub.setIdUsuario(asignado);
		sub.setCompletada(false);
		sub.setFechaCreacion(LocalDateTime.now());

		Subtarea saved = subtareaRepository.save(sub);

		// Notificar al usuario asignado a la subtarea
		if (asignado != null && !asignado.equals(tarea.getIdUsuarioCreador())) {
			crearNotificacion(asignado, "Se te ha asignado la subtarea: " + sub.getTitulo() + " en la tarea: " + tarea.getTitulo(), "NUEVA_SUBTAREA", tarea.getId());
		}

		return saved;
	}

	@Transactional
	public Subtarea alternarSubtarea(Long idSubtarea) {
		Subtarea sub = subtareaRepository.findById(idSubtarea)
				.orElseThrow(() -> new RuntimeException("Subtarea no encontrada"));

		boolean nuevoEstado = !sub.getCompletada();
		sub.setCompletada(nuevoEstado);
		sub.setFechaCompletado(nuevoEstado ? LocalDateTime.now() : null);

		return subtareaRepository.save(sub);
	}

	@Transactional
	public Subtarea actualizarSubtarea(Long idSubtarea, CreateSubtareaRequest request) {
		Subtarea sub = subtareaRepository.findById(idSubtarea)
				.orElseThrow(() -> new RuntimeException("Subtarea no encontrada"));

		if (request.getTitulo() != null && !request.getTitulo().trim().isEmpty()) {
			sub.setTitulo(request.getTitulo().trim());
		}
		if (request.getIdUsuario() != null && request.getIdUsuario() > 0 && usuarioRepository.existsById(request.getIdUsuario())) {
			Integer anterior = sub.getIdUsuario();
			sub.setIdUsuario(request.getIdUsuario());
			if (!request.getIdUsuario().equals(anterior)) {
				Tarea t = sub.getTarea();
				if (t != null && !request.getIdUsuario().equals(t.getIdUsuarioCreador())) {
					crearNotificacion(request.getIdUsuario(), "Se te ha reasignado la subtarea: " + sub.getTitulo() + " en la tarea: " + t.getTitulo(), "NUEVA_SUBTAREA", t.getId());
				}
			}
		}

		return subtareaRepository.save(sub);
	}

	@Transactional
	public void eliminarSubtarea(Long idSubtarea) {
		subtareaRepository.deleteById(idSubtarea);
	}

	// ==========================================
	// HISTORIAL Y ESTADOS
	// ==========================================
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
		
		// Notificar a todos los participantes de la tarea (creador, asignado principal y miembros asignados a subtareas)
		Set<Integer> destinatarios = new HashSet<>();
		if (tarea.getIdUsuario() != null) destinatarios.add(tarea.getIdUsuario());
		if (tarea.getIdUsuarioCreador() != null) destinatarios.add(tarea.getIdUsuarioCreador());
		if (tarea.getSubtareas() != null) {
			for (Subtarea s : tarea.getSubtareas()) {
				if (s.getIdUsuario() != null) destinatarios.add(s.getIdUsuario());
			}
		}
		destinatarios.remove(idUsuario);
		for (Integer destId : destinatarios) {
			crearNotificacion(destId, "Nuevo mensaje en la tarea: " + tarea.getTitulo(), "NUEVO_MENSAJE", tarea.getId());
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
