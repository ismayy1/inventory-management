package com.stocktrack.backend.audit.repository;

import com.stocktrack.backend.audit.enums.AuditAction;
import com.stocktrack.backend.audit.model.AuditLog;
import com.stocktrack.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUser(User user);

    @Query("SELECT a FROM AuditLog a WHERE a.user.id = :userId OR (a.user IS NULL AND a.username = :username)")
    List<AuditLog> findByUserIdOrUsername(@Param("userId") Long userId, @Param("username") String username);

    List<AuditLog> findByActionOrderByCreatedAtDesc(com.stocktrack.backend.audit.enums.AuditAction action);
    List<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);
    List<AuditLog> findByUsernameOrderByCreatedAtDesc(String username);
}
