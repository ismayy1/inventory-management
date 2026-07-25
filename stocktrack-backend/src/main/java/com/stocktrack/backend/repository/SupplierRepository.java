package com.stocktrack.backend.repository;

import com.stocktrack.backend.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    List<Supplier> findByNameContainingIgnoreCase(String name);
    List<Supplier> findByActiveTrue();
    List<Supplier> findByNameContainingIgnoreCaseAndActiveTrue(String name);
    List<Supplier> findByPhoneContaining(String phone);
    Optional<Supplier> findByNameIgnoreCase(String name);
    Optional<Supplier> findByEmailIgnoreCase(String email);
    Optional<Supplier> findByPhoneIgnoreCase(String phone);
    boolean existsByName(String name);
}
