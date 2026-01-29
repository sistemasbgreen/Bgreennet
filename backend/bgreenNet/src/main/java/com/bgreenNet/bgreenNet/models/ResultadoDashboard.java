package com.bgreenNet.bgreenNet.models;

import java.util.List;

public class ResultadoDashboard {
	
	   private List<String> fechas;
	    private List<Double> diario8;
	    private List<Double> diario10;
	    private List<Double> acumulado8;
	    private List<Double> acumulado10;
	    private List<Double> costoDiario;
	    private List<Double> costoAcumulado;
	    private List<Double> produccionTon;
	    private List<Double> costoNetoDiario; // duplicado intencional por compatibilidad con frontend
	    private List<RegistroDiario> datosCompletos;
		public List<String> getFechas() {
			return fechas;
		}
		public void setFechas(List<String> fechas) {
			this.fechas = fechas;
		}
		public List<Double> getDiario8() {
			return diario8;
		}
		public void setDiario8(List<Double> diario8) {
			this.diario8 = diario8;
		}
		public List<Double> getDiario10() {
			return diario10;
		}
		public void setDiario10(List<Double> diario10) {
			this.diario10 = diario10;
		}
		public List<Double> getAcumulado8() {
			return acumulado8;
		}
		public void setAcumulado8(List<Double> acumulado8) {
			this.acumulado8 = acumulado8;
		}
		public List<Double> getAcumulado10() {
			return acumulado10;
		}
		public void setAcumulado10(List<Double> acumulado10) {
			this.acumulado10 = acumulado10;
		}
		public List<Double> getCostoDiario() {
			return costoDiario;
		}
		public void setCostoDiario(List<Double> costoDiario) {
			this.costoDiario = costoDiario;
		}
		public List<Double> getCostoAcumulado() {
			return costoAcumulado;
		}
		public void setCostoAcumulado(List<Double> costoAcumulado) {
			this.costoAcumulado = costoAcumulado;
		}
		public List<Double> getProduccionTon() {
			return produccionTon;
		}
		public void setProduccionTon(List<Double> produccionTon) {
			this.produccionTon = produccionTon;
		}
		public List<Double> getCostoNetoDiario() {
			return costoNetoDiario;
		}
		public void setCostoNetoDiario(List<Double> costoNetoDiario) {
			this.costoNetoDiario = costoNetoDiario;
		}
		public List<RegistroDiario> getDatosCompletos() {
			return datosCompletos;
		}
		public void setDatosCompletos(List<RegistroDiario> datosCompletos) {
			this.datosCompletos = datosCompletos;
		}
	    
	    

}
