package com.bgreenNet.bgreenNet.dto;

public class DailyRecord {
	
	   private String date;
	    private double consumo;
	    private double produccion;
	    private int consumo_diario; // kg/ton
		public String getDate() {
			return date;
		}
		public void setDate(String date) {
			this.date = date;
		}
		public double getConsumo() {
			return consumo;
		}
		public void setConsumo(double consumo) {
			this.consumo = consumo;
		}
		public double getProduccion() {
			return produccion;
		}
		public void setProduccion(double produccion) {
			this.produccion = produccion;
		}
		public int getConsumo_diario() {
			return consumo_diario;
		}
		public void setConsumo_diario(int consumo_diario) {
			this.consumo_diario = consumo_diario;
		}
	    

	    
	    

}
