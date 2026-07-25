package com.stocktrack.backend.scheduler;

import com.stocktrack.backend.service.impl.JwtDenyListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class JwtCleanupScheduler {

    @Autowired
    private JwtDenyListService jwtDenyListService;

    // Clean expired tokens every hour
    @Scheduled(fixedRate = 3600000) // 1 hour
    public void cleanExpiredTokens() {
        jwtDenyListService.cleanExpiredTokens();
    }
}
