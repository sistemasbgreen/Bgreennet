package com.bgreenNet.bgreenNet.dto;

import java.util.List;

public class ProductoDTO {
	
    private String id;
    private String nombre;
    private String id_producto_siesa;
    private List<String> consumptionDocTypes;
    private List<String> productionDocTypes;
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public String getNombre() {
		return nombre;
	}
	public void setNombre(String nombre) {
		this.nombre = nombre;
	}
	public String getIdProductoSiesa() {
		return id_producto_siesa;
	}
	public void setIdProductoSiesa(String idProductoSiesa) {
		this.id_producto_siesa = idProductoSiesa;
	}
	public List<String> getConsumptionDocTypes() {
		return consumptionDocTypes;
	}
	public void setConsumptionDocTypes(List<String> consumptionDocTypes) {
		this.consumptionDocTypes = consumptionDocTypes;
	}
	public List<String> getProductionDocTypes() {
		return productionDocTypes;
	}
	public void setProductionDocTypes(List<String> productionDocTypes) {
		this.productionDocTypes = productionDocTypes;
	}
    
    

}
