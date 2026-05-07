package com.bgreenNet.bgreenNet.models;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "tareas")
@Data
public class Tarea {
	
	
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    @Column(name = "id_tarea")
	    private Long id;

	    @ManyToOne
	    @JoinColumn(name = "id_usuario", insertable = false, updatable = false)
	    private Usuario usuario;

	    @Column(name = "id_usuario")
	    private Integer idUsuario;

	    @ManyToOne
	    @JoinColumn(name = "id_usuario_creador", insertable = false, updatable = false)
	    private Usuario usuarioCreador;

	    @Column(name = "id_usuario_creador")
	    private Integer idUsuarioCreador;

	    @Column(name = "titulo")
	    private String titulo;

	    @Column(name = "descripcion")
	    private String descripcion;

	    @ManyToOne
	    @JoinColumn(name = "id_estado")
	    private EstadoTarea estado;

	    @ManyToOne
	    @JoinColumn(name = "id_prioridad")
	    private PrioridadTarea prioridad;

	    @Column(name = "fecha_creacion")
	    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
	    private LocalDateTime fechaCreacion;

	    @Column(name = "fecha_completado")
	    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
	    private LocalDateTime fechaCompletado;

	    @Column(name = "ultima_notificacion")
	    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
	    private LocalDateTime ultimaNotificacion;

	    @Column(name = "fecha_inicio")
	    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
	    private LocalDateTime fechaInicio;

	    @Column(name = "nota_cierre")
	    private String notaCierre;

		public Long getId() {
			return id;
		}

		public void setId(Long id) {
			this.id = id;
		}

		public Integer getIdUsuario() {
			return idUsuario;
		}

		public void setIdUsuario(Integer idUsuario) {
			this.idUsuario = idUsuario;
		}

		public Integer getIdUsuarioCreador() {
			return idUsuarioCreador;
		}

		public void setIdUsuarioCreador(Integer idUsuarioCreador) {
			this.idUsuarioCreador = idUsuarioCreador;
		}

		public String getTitulo() {
			return titulo;
		}

		public void setTitulo(String titulo) {
			this.titulo = titulo;
		}

		public String getDescripcion() {
			return descripcion;
		}

		public void setDescripcion(String descripcion) {
			this.descripcion = descripcion;
		}

		public EstadoTarea getEstado() {
			return estado;
		}

		public void setEstado(EstadoTarea estado) {
			this.estado = estado;
		}

		public PrioridadTarea getPrioridad() {
			return prioridad;
		}

		public void setPrioridad(PrioridadTarea prioridad) {
			this.prioridad = prioridad;
		}

		public LocalDateTime getFechaCreacion() {
			return fechaCreacion;
		}

		public void setFechaCreacion(LocalDateTime fechaCreacion) {
			this.fechaCreacion = fechaCreacion;
		}

		public LocalDateTime getFechaCompletado() {
			return fechaCompletado;
		}

		public void setFechaCompletado(LocalDateTime fechaCompletado) {
			this.fechaCompletado = fechaCompletado;
		}

		public LocalDateTime getUltimaNotificacion() {
			return ultimaNotificacion;
		}

		public void setUltimaNotificacion(LocalDateTime ultimaNotificacion) {
			this.ultimaNotificacion = ultimaNotificacion;
		}

		public String getNotaCierre() {
			return notaCierre;
		}

		public void setNotaCierre(String notaCierre) {
			this.notaCierre = notaCierre;
		}

		public LocalDateTime getFechaInicio() {
			return fechaInicio;
		}

		public void setFechaInicio(LocalDateTime fechaInicio) {
			this.fechaInicio = fechaInicio;
		}

	    @Column(name = "fecha_limite")
	    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
	    private LocalDateTime fechaLimite;

		public LocalDateTime getFechaLimite() {
			return fechaLimite;
		}

		public void setFechaLimite(LocalDateTime fechaLimite) {
			this.fechaLimite = fechaLimite;
		}
	    
	    
	    
	    
	    

}
