package com.stocktrack.backend.util;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class ResponseUtil {

    public ResponseEntity<Map<String, Object>> successResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        response.put("message", message);
        return ResponseEntity.ok(response);
    }

    public ResponseEntity<Map<String, Object>> errorResponse(String message, String error) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", error);
        response.put("message", message);
        return ResponseEntity.badRequest().body(response);
    }

    public ResponseEntity<Map<String, Object>> notFoundResponse(String message) {
        return errorResponse(message, "NOT_FOUND");
    }
}
