package com.bgreenNet.bgreenNet.dto;

public class IndustrializacionProveedorConfigDTO {
    private Integer id;
    private String nit;
    private String nombre;
    private Boolean activo;
    private Integer orden;

    public IndustrializacionProveedorConfigDTO() {}

    public IndustrializacionProveedorConfigDTO(Integer id, String nit, String nombre, Boolean activo, Integer orden) {
        this.id = id;
        this.nit = nit;
        this.nombre = nombre;
        this.activo = activo;
        this.orden = orden;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNit() {
        return nit;
    }

    public void setNit(String nit) {
        this.nit = nit;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public Integer getOrden() {
        return orden;
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
    }
}
