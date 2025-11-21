package com.bgreenNet.bgreenNet.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bgreenNet.bgreenNet.models.Perfil;

public interface PerfilRepository  extends JpaRepository <Perfil , Integer> {
	
	Perfil findByIdPerfil ( Integer idperfil);

}
