package com.bgreenNet.bgreenNet.dto;

public class UpdateTareaRequest {
	
	  private String titulo;
	    private String descripcion;
	    private Integer idEstado;
	    private Integer idPrioridad;
	    
	    
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
		public Integer getIdEstado() {
			return idEstado;
		}
		public void setIdEstado(Integer idEstado) {
			this.idEstado = idEstado;
		}
		public Integer getIdPrioridad() {
			return idPrioridad;
		}
		public void setIdPrioridad(Integer idPrioridad) {
			this.idPrioridad = idPrioridad;
		}
	    
	    
	    

}
