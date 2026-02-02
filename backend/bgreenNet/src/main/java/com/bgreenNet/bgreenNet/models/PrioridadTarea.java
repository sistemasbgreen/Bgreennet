package com.bgreenNet.bgreenNet.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;



@Entity
@Table(name = "prioridadesTarea")
@Data
public class PrioridadTarea {
	
	 @Id
	    @Column(name = "id_prioridad")
	    private Integer idPrioridad;

	    @Column(name = "nombre")
	    private String nombre;

	    @Column(name = "minutos_recordatorio")
	    private Integer minutosRecordatorio;

	    @Column(name = "color_rgb")
	    private String colorRgb;

		public Integer getIdPrioridad() {
			return idPrioridad;
		}

		public void setIdPrioridad(Integer idPrioridad) {
			this.idPrioridad = idPrioridad;
		}

		public String getNombre() {
			return nombre;
		}

		public void setNombre(String nombre) {
			this.nombre = nombre;
		}

		public Integer getMinutosRecordatorio() {
			return minutosRecordatorio;
		}

		public void setMinutosRecordatorio(Integer minutosRecordatorio) {
			this.minutosRecordatorio = minutosRecordatorio;
		}

		public String getColorRgb() {
			return colorRgb;
		}

		public void setColorRgb(String colorRgb) {
			this.colorRgb = colorRgb;
		}

}
