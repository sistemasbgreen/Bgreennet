package com.bgreenNet.bgreenNet.dto;

import lombok.Data;

@Data
public class SolicitarRecuperacionDTO {
    private String usuarioOCorreo;

    public String getUsuarioOCorreo() {
        return usuarioOCorreo;
    }

    public void setUsuarioOCorreo(String usuarioOCorreo) {
        this.usuarioOCorreo = usuarioOCorreo;
    }
}
