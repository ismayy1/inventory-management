package com.stocktrack.backend.audit.model;

import com.stocktrack.backend.audit.enums.AuditAction;
import com.stocktrack.backend.model.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @Column(name = "username", length = 50)
    private String username;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "details", length = 2000)
    private String details;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public AuditLog() {
        this.createdAt = LocalDateTime.now();
    }

    public AuditLog(AuditAction action, User user, String details) {
        this();
        this.action = action;
        this.user = user;
        this.username = (user != null) ? user.getUsername() : "SYSTEM";
        this.details = details;
    }

    public AuditLog(AuditAction action, String username, String details) {
        this();
        this.action = action;
        this.username = username;
        this.details = details;
    }

    public Long getUserId() {
        return (user != null) ? user.getId() : null;
    }
}
