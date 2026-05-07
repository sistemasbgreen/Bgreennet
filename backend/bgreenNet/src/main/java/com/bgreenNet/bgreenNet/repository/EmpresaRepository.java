package com.bgreenNet.bgreenNet.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bgreenNet.bgreenNet.models.Empresa;

public interface EmpresaRepository extends JpaRepository < Empresa, Integer> {
	

	 Empresa findByidEmpresa(Integer idEmpresa);
}
