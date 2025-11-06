package com.bgreenNet.bgreenNet.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bgreenNet.bgreenNet.models.Usuario;





public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
	
	 Optional<Usuario> findByUsuario(String usuario);

}
