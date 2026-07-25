package com.stocktrack.backend.audit.dto;

import com.stocktrack.backend.audit.enums.AuditAction;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AuditLogDTO {

    private Long id;
    private AuditAction action;
    private Long userId;
    private String username;
    private String ipAddress;
    private String userAgent;
    private String details;
    private LocalDateTime createdAt;
}
