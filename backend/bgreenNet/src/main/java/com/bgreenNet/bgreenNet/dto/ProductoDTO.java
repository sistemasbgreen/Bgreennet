package com.bgreenNet.bgreenNet.dto;

import java.util.List;

public class ProductoDTO {
    
    private String id;
    private String nombre;
    private Object idProductoSiesa;
    private List<String> consumptionDocTypes;
    private List<String> productionDocTypes;
    private List<Integer> consumptionDocIds;
    private List<Integer> productionDocIds;
    private Double metaActual;

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

    public Object getIdProductoSiesa() {
        return idProductoSiesa;
    }

    public void setIdProductoSiesa(Object idProductoSiesa) {
        this.idProductoSiesa = idProductoSiesa;
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

    public List<Integer> getConsumptionDocIds() {
        return consumptionDocIds;
    }

    public void setConsumptionDocIds(List<Integer> consumptionDocIds) {
        this.consumptionDocIds = consumptionDocIds;
    }

    public List<Integer> getProductionDocIds() {
        return productionDocIds;
    }

    public void setProductionDocIds(List<Integer> productionDocIds) {
        this.productionDocIds = productionDocIds;
    }

    public Double getMetaActual() {
        return metaActual;
    }

    public void setMetaActual(Double metaActual) {
        this.metaActual = metaActual;
    }
}
