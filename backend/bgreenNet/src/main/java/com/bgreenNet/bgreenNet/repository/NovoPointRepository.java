package com.bgreenNet.bgreenNet.repository;

import com.bgreenNet.bgreenNet.models.NovoPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NovoPointRepository extends JpaRepository<NovoPoint, Long> {
}
