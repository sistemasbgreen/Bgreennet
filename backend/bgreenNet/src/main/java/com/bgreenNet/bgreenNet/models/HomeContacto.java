package com.bgreenNet.bgreenNet.models;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class HomeContacto {

    @Id
    private String nombre; // basta con un campo identificador

    private String cargo;
    private String correo;
    private String ext;

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getCargo() {
        return cargo;
    }

    public void setCargo(String cargo) {
        this.cargo = cargo;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getExt() {
        return ext;
    }

    public void setExt(String ext) {
        this.ext = ext;
    }
}
