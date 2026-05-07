package com.bgreenNet.bgreenNet.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bgreenNet.bgreenNet.models.SistemasInformacion;

public interface SistemaInformacionRepository extends JpaRepository<SistemasInformacion, Long> {
	
	  List<SistemasInformacion> findByActivoTrue();
	  

	    @Query(value = "EXEC sp_ObtenerSistemasXperfil :idPerfil", nativeQuery = true)
	    List<SistemasInformacion> findSistemasByPerfil(@Param("idPerfil") Long idPerfil);
}