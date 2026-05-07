package com.bgreenNet.bgreenNet.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResumenCostosDTO {
    private BigDecimal totalPurificacionGlicerina;
    private BigDecimal totalManoObra;
    private BigDecimal totalOtrosCostos;
    
	public BigDecimal getTotalPurificacionGlicerina() {
		return totalPurificacionGlicerina;
	}
	public void setTotalPurificacionGlicerina(BigDecimal totalPurificacionGlicerina) {
		this.totalPurificacionGlicerina = totalPurificacionGlicerina;
	}
	public BigDecimal getTotalManoObra() {
		return totalManoObra;
	}
	public void setTotalManoObra(BigDecimal totalManoObra) {
		this.totalManoObra = totalManoObra;
	}
	public BigDecimal getTotalOtrosCostos() {
		return totalOtrosCostos;
	}
	public void setTotalOtrosCostos(BigDecimal totalOtrosCostos) {
		this.totalOtrosCostos = totalOtrosCostos;
	}
    
    
}