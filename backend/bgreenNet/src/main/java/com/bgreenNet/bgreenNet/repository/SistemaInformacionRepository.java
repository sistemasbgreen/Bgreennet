package com.bgreenNet.bgreenNet.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bgreenNet.bgreenNet.models.SistemasInformacion;



public interface SistemaInformacionRepository extends JpaRepository<SistemasInformacion, Long> {
	
	  List<SistemasInformacion> findByActivoTrue();
}