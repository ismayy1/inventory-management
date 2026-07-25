package com.stocktrack.backend.service.impl;

import com.stocktrack.backend.dto.response.HealthResponse;
import com.stocktrack.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class HealthService {

    @Autowired
    private UserRepository userRepository; // Any repository will do

    public HealthResponse checkHealth() {
        try {
            // Simple DB connectivity test: count users
            userRepository.checkConnection();
            return HealthResponse.up();
        } catch (Exception e) {
            HealthResponse.ComponentStatus dbStatus =
                    new HealthResponse.ComponentStatus("DOWN", e.getMessage());
            return HealthResponse.down(dbStatus);
        }
    }
}
