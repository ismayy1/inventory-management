package com.stocktrack.backend.repository;

import com.stocktrack.backend.enums.Role;
import com.stocktrack.backend.model.RoleEntity;
import com.stocktrack.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.isActive = true")
    List<User> findActiveUsers();

    @Query("SELECT u FROM User u WHERE u.isActive = true AND :role MEMBER OF u.roles")
    List<User> findActiveUsersByRole(RoleEntity role);

    @Query(value = "SELECT 1", nativeQuery = true)
    Integer checkConnection();

    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true AND :admin MEMBER OF u.roles")
    long countActiveAdmins();
}
