package com.bgreenNet.bgreenNet.repository;

import com.bgreenNet.bgreenNet.models.NovoHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NovoHistoryRepository extends JpaRepository<NovoHistory, Long> {
}
