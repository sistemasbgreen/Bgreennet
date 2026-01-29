package com.bgreenNet.bgreenNet.models;

public class ProduccionData {

	private String fechaDocumento;
	private Double canti; // producción en toneladas
	private Double costoBruto; // costo bruto B100

	public String getFechaDocumento() {
		return fechaDocumento;
	}

	public void setFechaDocumento(String fechaDocumento) {
		this.fechaDocumento = fechaDocumento;
	}

	public Double getCanti() {
		return canti;
	}

	public void setCanti(Double canti) {
		this.canti = canti;
	}

	public Double getCostoBruto() {
		return costoBruto;
	}

	public void setCostoBruto(Double costoBruto) {
		this.costoBruto = costoBruto;
	}

}
