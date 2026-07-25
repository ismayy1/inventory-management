package com.stocktrack.backend.controller;

import com.stocktrack.backend.audit.dto.AuditLogDTO;
import com.stocktrack.backend.audit.enums.AuditAction;
import com.stocktrack.backend.audit.model.AuditLog;
import com.stocktrack.backend.audit.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Page<AuditLogDTO>> getAllLogs(Pageable pageable) {
        Page<AuditLog> logs = auditLogService.getAllLogs(pageable);
        Page<AuditLogDTO> dtoPage = logs.map(this::convertToDto);
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<Page<AuditLogDTO>> getLogsByUser(@PathVariable Long userId, Pageable pageable) {
        Page<AuditLog> logs = auditLogService.getLogByUser(userId, pageable);
        Page<AuditLogDTO> dtoPage = logs.map(this::convertToDto);
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/action/{action}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Page<AuditLogDTO>> getLogsByAction(@PathVariable AuditAction action, Pageable pageable) {
        Page<AuditLog> logs = auditLogService.getLogsByAction(action, pageable);
        Page<AuditLogDTO> dtoPage = logs.map(this::convertToDto);
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Page<AuditLogDTO>> searchLogsByUsername(@RequestParam String username, Pageable pageable) {
        Page<AuditLog> logs = auditLogService.searchLogsByUsername(username, pageable);
        Page<AuditLogDTO> dtoPage = logs.map(this::convertToDto);
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Page<AuditLogDTO>> getLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)LocalDateTime end,
            Pageable pageable) {
        Page<AuditLog> logs = auditLogService.getLogsByDateRange(start, end, pageable);
        Page<AuditLogDTO> dtoPage = logs.map(this::convertToDto);
        return ResponseEntity.ok(dtoPage);
    }


//     helper method to convert entity to DTO
    private AuditLogDTO convertToDto(AuditLog auditLog) {
        AuditLogDTO dto = new AuditLogDTO();
        dto.setId(auditLog.getId());
        dto.setAction(auditLog.getAction());
        dto.setUserId(auditLog.getUserId());
        dto.setUsername(auditLog.getUsername());
        dto.setIpAddress(auditLog.getIpAddress());
        dto.setUserAgent(auditLog.getUserAgent());
        dto.setDetails(auditLog.getDetails());
        dto.setCreatedAt(auditLog.getCreatedAt());
        return dto;
    }
}
