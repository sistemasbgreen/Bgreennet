package com.bgreenNet.bgreenNet.models;

public class ConsumoData {
	 private String fechaDocumento;
	    private String productoId; // "8" o "10"
	    private Double cantidadConsumida;
		public String getFechaDocumento() {
			return fechaDocumento;
		}
		public void setFechaDocumento(String fechaDocumento) {
			this.fechaDocumento = fechaDocumento;
		}
		public String getProductoId() {
			return productoId;
		}
		public void setProductoId(String productoId) {
			this.productoId = productoId;
		}
		public Double getCantidadConsumida() {
			return cantidadConsumida;
		}
		public void setCantidadConsumida(Double cantidadConsumida) {
			this.cantidadConsumida = cantidadConsumida;
		}  
	    	    
}
