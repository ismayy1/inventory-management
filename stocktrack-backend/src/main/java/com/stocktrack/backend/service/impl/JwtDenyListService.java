package com.stocktrack.backend.service.impl;

import com.stocktrack.backend.model.JwtDenyList;
import com.stocktrack.backend.repository.JwtDenyListRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@Transactional
public class JwtDenyListService {

    @Autowired
    private JwtDenyListRepository jwtDenylistRepository;

    public void addTokenToDenyList(String token, Instant expiryAt) {
        JwtDenyList denyListEntry = new JwtDenyList(token, expiryAt);
        jwtDenylistRepository.save(denyListEntry);
    }

    public boolean isTokenDenied(String token) {
        return jwtDenylistRepository.existsByToken(token);
    }

    @Transactional
    public void cleanExpiredTokens() {
        jwtDenylistRepository.deleteExpiredTokens(Instant.now());
    }
}
