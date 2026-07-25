package com.stocktrack.backend.audit.service;

import com.stocktrack.backend.audit.enums.AuditAction;
import com.stocktrack.backend.audit.model.AuditLog;
import com.stocktrack.backend.model.User;
import com.stocktrack.backend.repository.AuditLogRepository;
import com.stocktrack.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;
    @Autowired
    private UserRepository userRepository;


    @Transactional
    public void logAction(AuditAction action, Long userId, String username, String details, HttpServletRequest request) {
        User user = null;
        if (userId != null && userId > 0) {
            Optional<User> userOpt = userRepository.findById(userId);
            user = userOpt.orElse(null);

            if (user == null && username != null && !username.equals("SYSTEM")) {
                System.err.println("Warning: Audit log for non-existent user ID " + userId +
                        " (username: " + username + "). Preserving username for audit trail.");
            }
        }

        AuditLog auditLog = new AuditLog(action, user, details);

        auditLog.setIpAddress(getClientIp(request));
        auditLog.setUserAgent(request.getHeader("User-Agent"));

        if (username != null) {
            auditLog.setUsername(username);
        } else if (user != null) {
            auditLog.setUsername(user.getUsername());
        } else {
            auditLog.setUsername("SYSTEM");
        }

        auditLogRepository.save(auditLog);
    }

//    GET all audit logs - paginated
    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

//    GET audit logs for specific user
    public Page<AuditLog> getLogByUser(Long userId, Pageable pageable) {
        return  auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

//    GET audit logs by auction type
    public Page<AuditLog> getLogsByAction(AuditAction action, Pageable pageable) {
        return auditLogRepository.findByActionOrderByCreatedAtDesc(action, pageable);
    }

//    GET audit logs by action range
    public Page<AuditLog> getLogsByDateRange(LocalDateTime start, LocalDateTime end, Pageable pageable) {
        return auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end, pageable);
    }

//    GET audit logs by username - search
    public Page<AuditLog> searchLogsByUsername(String username, Pageable pageable) {
        return auditLogRepository.findByUsernameContainingIgnoreCaseOrderByCreatedAtDesc(username, pageable);
    }

    private String getClientIp(HttpServletRequest request) {
        String[] headers = {
                "X-Forwarded-For",
                "X-Real-IP",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP",
                "HTTP_CLIENT_IP",
                "HTTP_X_FORWARDED_FOR"
        };

        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !ip.equalsIgnoreCase("unknown")) {
                return ip.contains(",") ? ip.split(",")[0].trim() : ip.trim();
            }
        }

        String remoteAddr = request.getRemoteAddr();

        if ("0:0:0:0:0:0:0:1".equals(remoteAddr)) {
            return "127.0.0.1";
        }

        return remoteAddr != null ? remoteAddr.trim() : "unknown";
    }

//     Helper method to get client IP address
//    private String getClientIpAddress(HttpServletRequest request) {
//        String xForwardedFor = request.getHeader("X-Forwarded-For");
//        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
//            return xForwardedFor.split(",")[0].trim();
//        }
//
//        String xRealIp = request.getHeader("X-Real-IP");
//        if (xRealIp != null && !xRealIp.isEmpty()) {
//            return xRealIp;
//        }
//
//        return request.getRemoteAddr();
//    }
}
