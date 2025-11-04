package com.bgreenNet.bgreenNet.services;

import java.util.Collections;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.models.Usuario;
import com.bgreenNet.bgreenNet.repository.UsuarioRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService  {

	  @Autowired
	    private UsuarioRepository usuarioRepository;

	    @Override
	    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
	        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsuario(username);
	        if (usuarioOpt.isEmpty()) {
	            throw new UsernameNotFoundException("Usuario no encontrado: " + username);
	        }

	        Usuario usuario = usuarioOpt.get();
	        if (usuario.getActivo() != 1) {
	            throw new UsernameNotFoundException("Usuario inactivo: " + username);
	        }

	        // ✅ Sin roles: lista vacía de authorities
	        return new User(usuario.getUsuario(), usuario.getContrasena(), Collections.emptyList());
	    }
}
