package com.bgreenNet.bgreenNet.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
@Entity
@Table(name = "estadosTarea")
public class EstadoTarea {

    @Id
    @Column(name = "id_estado")
    private Integer id;

    // Constantes de Estado
    public static final int CREADA = 1;
    public static final int INICIADA = 2;
    public static final int FINALIZADA = 3;
    public static final int CANCELADA = 4;

    @Column(name = "nombre")
    private String nombre;

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}
    
    
    
}
   

