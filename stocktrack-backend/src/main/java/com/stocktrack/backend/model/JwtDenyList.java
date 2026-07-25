package com.stocktrack.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Getter
@Setter
@Table(name = "jwt_denylist")
public class JwtDenyList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token", nullable = false, unique = true)
    private String token;

    @Column(name = "expiry_at", nullable = false)
    private Instant expiryAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public JwtDenyList() {
        this.createdAt = Instant.now();
    }

    public JwtDenyList(String token, Instant expiryAt) {
        this();
        this.token = token;
        this.expiryAt = expiryAt;
    }
}
