package com.bgreenNet.bgreenNet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;

import com.bgreenNet.bgreenNet.models.Perfil;

public interface PerfilRepository  extends JpaRepository <Perfil , Integer> {
	

	
	  @Procedure(procedureName = "sp_Crear_Perfil")
	    void spCrearPerfil(
	        String descripcionPerfil,
	        Boolean activo
	    );

	  @Procedure(procedureName = "sp_ActualizarPerfil")
	    void spActualizarPerfil(
	        @Param("id_perfil") Integer idPerfil,
	        @Param("descripcionPerfil") String descripcionPerfil,
	        @Param("activo") Boolean activo
	    );
	  

	  @Modifying
	    @Query(value = "EXEC sp_AsignarPermisoAPerfil :idPerfilFk, :idSistemaFk", nativeQuery = true)
	    void asignarPermiso(@Param("idPerfilFk") Integer idPerfilFk, @Param("idSistemaFk") Integer idSistemaFk);

	    @Modifying
	    @Query(value = "EXEC sp_EliminarPermisoDePerfil :idPerfilFk, :idSistemaFk", nativeQuery = true)
	    void eliminarPermiso(@Param("idPerfilFk") Integer idPerfilFk, @Param("idSistemaFk") Integer idSistemaFk);

}
