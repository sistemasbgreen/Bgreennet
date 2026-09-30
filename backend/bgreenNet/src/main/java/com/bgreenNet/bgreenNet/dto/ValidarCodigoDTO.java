package com.bgreenNet.bgreenNet.dto;

import lombok.Data;

@Data
public class ValidarCodigoDTO {
    private String usuario;
    private String codigo;

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }
}
