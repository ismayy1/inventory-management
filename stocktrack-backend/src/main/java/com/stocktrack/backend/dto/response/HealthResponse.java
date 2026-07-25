package com.stocktrack.backend.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class HealthResponse {

    private String status;
    private ComponentStatus database;
    private LocalDateTime timestamp;
    private String version;

    public HealthResponse() {
        this.timestamp = LocalDateTime.now();
        this.version = "1.0.0"; // Update as needed
    }

    // Static factory methods
    public static HealthResponse up() {
        HealthResponse response = new HealthResponse();
        response.setStatus("UP");
        response.setDatabase(new ComponentStatus("UP"));
        return response;
    }

    public static HealthResponse down(ComponentStatus dbStatus) {
        HealthResponse response = new HealthResponse();
        response.setStatus("DOWN");
        response.setDatabase(dbStatus);
        return response;
    }

    // Inner class for component status
    public static class ComponentStatus {
        private String status;
        private String error;

        public ComponentStatus(String status) {
            this.status = status;
        }

        public ComponentStatus(String status, String error) {
            this.status = status;
            this.error = error;
        }

        // Getters
        public String getStatus() { return status; }
        public String getError() { return error; }
    }
}
