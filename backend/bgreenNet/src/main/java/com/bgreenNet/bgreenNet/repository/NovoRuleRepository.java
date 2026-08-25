package com.bgreenNet.bgreenNet.repository;

import com.bgreenNet.bgreenNet.models.NovoRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NovoRuleRepository extends JpaRepository<NovoRule, Long> {
}
