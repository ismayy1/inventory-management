package com.stocktrack.backend.repository;

import com.stocktrack.backend.model.JwtDenyList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface JwtDenyListRepository extends JpaRepository<JwtDenyList, Long> {

    Optional<JwtDenyList> findByToken(String token);

    boolean existsByToken(String token);

    @Modifying
    @Query("DELETE FROM JwtDenyList j WHERE j.expiryAt < :now")
    void deleteExpiredTokens(@Param("now") Instant now);
}
