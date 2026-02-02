package com.bgreenNet.bgreenNet.models;

import java.time.LocalDateTime;

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

	    @Column(name = "id_usuario")
	    private Integer idUsuario;

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
	    private LocalDateTime fechaCreacion;

	    @Column(name = "fecha_completado")
	    private LocalDateTime fechaCompletado;

	    @Column(name = "ultima_notificacion")
	    private LocalDateTime ultimaNotificacion;

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
	    
	    
	    
	    
	    

}
