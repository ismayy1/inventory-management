package com.stocktrack.backend.controller;

import com.stocktrack.backend.dto.response.HealthResponse;
import com.stocktrack.backend.service.impl.HealthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
@RestController
@RequestMapping("/api")
public class HealthController {

    @Autowired
    private HealthService healthService;

//    this endpoint shouldn't require any authentication, it returns the status of DB and system
    @GetMapping("/health")
    public ResponseEntity<HealthResponse> healthCheck() {
        HealthResponse health = healthService.checkHealth();
        if ("UP".equals(health.getStatus())) {
            return ResponseEntity.ok(health);
        } else {
            return ResponseEntity.status(503).body(health); // Service Unavailable
        }
    }
}
