package com.stocktrack.backend.repository;

import com.stocktrack.backend.enums.Role;
import com.stocktrack.backend.model.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<RoleEntity, Long> {
    Optional<RoleEntity> findByName(Role name);
    boolean existsByName(Role name);
}
