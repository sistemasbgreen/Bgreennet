package com.bgreenNet.bgreenNet.dto;

import java.time.LocalDateTime;

public class MetaDetalleDTO {
    private Integer mes;
    private Double valor;
    private LocalDateTime dateCreate;
    private LocalDateTime dateModify;
    private String userName;

    public MetaDetalleDTO() {}

    public MetaDetalleDTO(Integer mes, Double valor, LocalDateTime dateCreate, LocalDateTime dateModify, String userName) {
        this.mes = mes;
        this.valor = valor;
        this.dateCreate = dateCreate;
        this.dateModify = dateModify;
        this.userName = userName;
    }

    public Integer getMes() {
        return mes;
    }

    public void setMes(Integer mes) {
        this.mes = mes;
    }

    public Double getValor() {
        return valor;
    }
// ... rest of the file

    public void setValor(Double valor) {
        this.valor = valor;
    }

    public LocalDateTime getDateCreate() {
        return dateCreate;
    }

    public void setDateCreate(LocalDateTime dateCreate) {
        this.dateCreate = dateCreate;
    }

    public LocalDateTime getDateModify() {
        return dateModify;
    }

    public void setDateModify(LocalDateTime dateModify) {
        this.dateModify = dateModify;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }
}
