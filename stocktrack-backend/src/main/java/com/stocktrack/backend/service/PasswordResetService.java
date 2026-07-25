package com.stocktrack.backend.service;

public interface PasswordResetService {

    String generateResetToken(String username);
    boolean validateToken(String token);
    void resetPassword(String token, String newPassword);
    void cleanupExpiredTokens();
}
