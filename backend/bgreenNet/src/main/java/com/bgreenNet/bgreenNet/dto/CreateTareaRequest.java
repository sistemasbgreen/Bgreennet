package com.bgreenNet.bgreenNet.dto;

import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTareaRequest {
    private Integer idUsuario;
    private Integer idUsuarioCreador;
    private String titulo;
    private String descripcion;
    private Integer idEstado;
    private Integer idPrioridad;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaLimite;
    private List<CreateSubtareaRequest> subtareas;
    private List<Integer> idUsuariosAsignados;

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Integer getIdUsuarioCreador() {
        return idUsuarioCreador;
    }

    public void setIdUsuarioCreador(Integer idUsuarioCreador) {
        this.idUsuarioCreador = idUsuarioCreador;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Integer getIdEstado() {
        return idEstado;
    }

    public void setIdEstado(Integer idEstado) {
        this.idEstado = idEstado;
    }

    public Integer getIdPrioridad() {
        return idPrioridad;
    }

    public void setIdPrioridad(Integer idPrioridad) {
        this.idPrioridad = idPrioridad;
    }

    public LocalDateTime getFechaLimite() {
        return fechaLimite;
    }

    public void setFechaLimite(LocalDateTime fechaLimite) {
        this.fechaLimite = fechaLimite;
    }

    public List<CreateSubtareaRequest> getSubtareas() {
        return subtareas;
    }

    public void setSubtareas(List<CreateSubtareaRequest> subtareas) {
        this.subtareas = subtareas;
    }

    public List<Integer> getIdUsuariosAsignados() {
        return idUsuariosAsignados;
    }

    public void setIdUsuariosAsignados(List<Integer> idUsuariosAsignados) {
        this.idUsuariosAsignados = idUsuariosAsignados;
    }
}
