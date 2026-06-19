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
    private List<Integer> consumptionDocOrden;
    private List<Integer> productionDocOrden;
    private List<String> consumptionDocOrigenIds;
    private List<String> productionDocOrigenIds;
    private Double metaActual;
    private Boolean esCompuesto;
    private List<String> componenteSiesaIds;
    private Boolean usaSuma;
    private Boolean sentidoMeta;
    private Boolean mostrarCmi;
    private String produccionBaseId;
    private String idProductoTbs;
    private String idTbsTipoDoc;
    private String tbsDescripcion;
    private Integer seccionId;
    private String seccionNombre;
    private Integer ordenReporte;
    private List<String> formulaOperadores;

    public Integer getSeccionId() {
        return seccionId;
    }

    public void setSeccionId(Integer seccionId) {
        this.seccionId = seccionId;
    }

    public String getSeccionNombre() {
        return seccionNombre;
    }

    public void setSeccionNombre(String seccionNombre) {
        this.seccionNombre = seccionNombre;
    }

    public Integer getOrdenReporte() {
        return ordenReporte;
    }

    public void setOrdenReporte(Integer ordenReporte) {
        this.ordenReporte = ordenReporte;
    }
    public String getIdProductoTbs() {
        return idProductoTbs;
    }

    public void setIdProductoTbs(String idProductoTbs) {
        this.idProductoTbs = idProductoTbs;
    }

    public String getIdTbsTipoDoc() {
        return idTbsTipoDoc;
    }

    public void setIdTbsTipoDoc(String idTbsTipoDoc) {
        this.idTbsTipoDoc = idTbsTipoDoc;
    }

    public String getTbsDescripcion() {
        return tbsDescripcion;
    }

    public void setTbsDescripcion(String tbsDescripcion) {
        this.tbsDescripcion = tbsDescripcion;
    }

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

    public List<Integer> getConsumptionDocOrden() {
        return consumptionDocOrden;
    }

    public void setConsumptionDocOrden(List<Integer> consumptionDocOrden) {
        this.consumptionDocOrden = consumptionDocOrden;
    }

    public List<Integer> getProductionDocOrden() {
        return productionDocOrden;
    }

    public void setProductionDocOrden(List<Integer> productionDocOrden) {
        this.productionDocOrden = productionDocOrden;
    }

    public List<String> getConsumptionDocOrigenIds() {
        return consumptionDocOrigenIds;
    }

    public void setConsumptionDocOrigenIds(List<String> consumptionDocOrigenIds) {
        this.consumptionDocOrigenIds = consumptionDocOrigenIds;
    }

    public List<String> getProductionDocOrigenIds() {
        return productionDocOrigenIds;
    }

    public void setProductionDocOrigenIds(List<String> productionDocOrigenIds) {
        this.productionDocOrigenIds = productionDocOrigenIds;
    }

    public Double getMetaActual() {
        return metaActual;
    }

    public void setMetaActual(Double metaActual) {
        this.metaActual = metaActual;
    }

    public Boolean getEsCompuesto() {
        return esCompuesto;
    }

    public void setEsCompuesto(Boolean esCompuesto) {
        this.esCompuesto = esCompuesto;
    }

    public List<String> getComponenteSiesaIds() {
        return componenteSiesaIds;
    }

    public void setComponenteSiesaIds(List<String> componenteSiesaIds) {
        this.componenteSiesaIds = componenteSiesaIds;
    }

    public Boolean getUsaSuma() {
        return usaSuma;
    }

    public void setUsaSuma(Boolean usaSuma) {
        this.usaSuma = usaSuma;
    }

    public Boolean getSentidoMeta() {
        return sentidoMeta;
    }

    public void setSentidoMeta(Boolean sentidoMeta) {
        this.sentidoMeta = sentidoMeta;
    }

    public Boolean getMostrarCmi() {
        return mostrarCmi;
    }

    public void setMostrarCmi(Boolean mostrarCmi) {
        this.mostrarCmi = mostrarCmi;
    }

    public String getProduccionBaseId() {
        return produccionBaseId;
    }

    public void setProduccionBaseId(String produccionBaseId) {
        this.produccionBaseId = produccionBaseId;
    }

    public Boolean getMetaDiariaManual() {
        return metaDiariaManual;
    }

    public void setMetaDiariaManual(Boolean metaDiariaManual) {
        this.metaDiariaManual = metaDiariaManual;
    }

    private Boolean metaDiariaManual;

    public List<String> getFormulaOperadores() {
        return formulaOperadores;
    }

    public void setFormulaOperadores(List<String> formulaOperadores) {
        this.formulaOperadores = formulaOperadores;
    }
}
