package com.bgreenNet.bgreenNet.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class OpDoctoDTO {
	
	 private String  idTipoDocto;
	    private Long    consecDocto;
	    private String  indEstado;
	    private LocalDateTime fechaTsCreacion;
	    private LocalDateTime fechaTsAprobacion;
	    private LocalDateTime fechaTsAnulacion;
	    private LocalDate     fechaCumplida;       // ←  disparador de OP
	    private String  notas;
	    private String  usuarioCumplido;
		public String getIdTipoDocto() {
			return idTipoDocto;
		}
		public void setIdTipoDocto(String idTipoDocto) {
			this.idTipoDocto = idTipoDocto;
		}
		public Long getConsecDocto() {
			return consecDocto;
		}
		public void setConsecDocto(Long consecDocto) {
			this.consecDocto = consecDocto;
		}
		public String getIndEstado() {
			return indEstado;
		}
		public void setIndEstado(String indEstado) {
			this.indEstado = indEstado;
		}
		public LocalDateTime getFechaTsCreacion() {
			return fechaTsCreacion;
		}
		public void setFechaTsCreacion(LocalDateTime fechaTsCreacion) {
			this.fechaTsCreacion = fechaTsCreacion;
		}
		public LocalDateTime getFechaTsAprobacion() {
			return fechaTsAprobacion;
		}
		public void setFechaTsAprobacion(LocalDateTime fechaTsAprobacion) {
			this.fechaTsAprobacion = fechaTsAprobacion;
		}
		public LocalDateTime getFechaTsAnulacion() {
			return fechaTsAnulacion;
		}
		public void setFechaTsAnulacion(LocalDateTime fechaTsAnulacion) {
			this.fechaTsAnulacion = fechaTsAnulacion;
		}
		public LocalDate getFechaCumplida() {
			return fechaCumplida;
		}
		public void setFechaCumplida(LocalDate fechaCumplida) {
			this.fechaCumplida = fechaCumplida;
		}
		public String getNotas() {
			return notas;
		}
		public void setNotas(String notas) {
			this.notas = notas;
		}
		public String getUsuarioCumplido() {
			return usuarioCumplido;
		}
		public void setUsuarioCumplido(String usuarioCumplido) {
			this.usuarioCumplido = usuarioCumplido;
		}
	    
	    

}
