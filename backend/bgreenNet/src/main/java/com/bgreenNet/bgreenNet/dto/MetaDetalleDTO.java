package com.bgreenNet.bgreenNet.dto;

import java.time.LocalDateTime;

public class MetaDetalleDTO {
    private Double valor;
    private LocalDateTime dateCreate;
    private LocalDateTime dateModify;
    private String userName;

    public MetaDetalleDTO() {}

    public MetaDetalleDTO(Double valor, LocalDateTime dateCreate, LocalDateTime dateModify, String userName) {
        this.valor = valor;
        this.dateCreate = dateCreate;
        this.dateModify = dateModify;
        this.userName = userName;
    }

    public Double getValor() {
        return valor;
    }

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
