package com.stocktrack.backend.service.impl;

import com.stocktrack.backend.model.PasswordResetToken;
import com.stocktrack.backend.model.User;
import com.stocktrack.backend.repository.PasswordResetTokenRepository;
import com.stocktrack.backend.repository.UserRepository;
import com.stocktrack.backend.service.PasswordResetService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordResetTokenRepository tokenRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public String generateResetToken(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

//        Cleaning any existing tokens for this user
        tokenRepository.deleteByExpiryDateBefore(LocalDateTime.now());

//        Create new token
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        tokenRepository.save(token);

        return token.getToken();
    }

    @Override
    public boolean validateToken(String token) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        return tokenOpt.map(PasswordResetToken::isValid).orElse(false);
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired token!"));

        if (!resetToken.isValid()) {
            throw new RuntimeException("Invalid or Expired token!");
        }

//        Updating password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

//        marking token as used
        resetToken.setIsUsed(true);
        tokenRepository.save(resetToken);
    }

    @Override
    public void cleanupExpiredTokens() {
        tokenRepository.deleteByExpiryDateBefore(LocalDateTime.now());
    }
}
