package com.bgreenNet.bgreenNet.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetalleInsumoDTO {
    private String ordenProduccion;   // ej: "OP-46001-B100"
    private String nombreSeccion;     // ej: "Biodiesel Destilado"
    private String item;
    private String descripcion;
    private LocalDate fecha;
    private BigDecimal cantidadConsumida;
	public String getOrdenProduccion() {
		return ordenProduccion;
	}
	public void setOrdenProduccion(String ordenProduccion) {
		this.ordenProduccion = ordenProduccion;
	}
	public String getNombreSeccion() {
		return nombreSeccion;
	}
	public void setNombreSeccion(String nombreSeccion) {
		this.nombreSeccion = nombreSeccion;
	}
	public String getItem() {
		return item;
	}
	public void setItem(String item) {
		this.item = item;
	}
	public String getDescripcion() {
		return descripcion;
	}
	public void setDescripcion(String descripcion) {
		this.descripcion = descripcion;
	}
	public LocalDate getFecha() {
		return fecha;
	}
	public void setFecha(LocalDate fecha) {
		this.fecha = fecha;
	}
	public BigDecimal getCantidadConsumida() {
		return cantidadConsumida;
	}
	public void setCantidadConsumida(BigDecimal cantidadConsumida) {
		this.cantidadConsumida = cantidadConsumida;
	}

    
}