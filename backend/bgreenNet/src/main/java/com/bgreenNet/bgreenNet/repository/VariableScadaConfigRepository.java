package com.bgreenNet.bgreenNet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.bgreenNet.bgreenNet.models.VariableScadaConfig;

@Repository
public interface VariableScadaConfigRepository extends JpaRepository<VariableScadaConfig, String> {
}
