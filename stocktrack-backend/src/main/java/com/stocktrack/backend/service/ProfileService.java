package com.stocktrack.backend.service;

import com.stocktrack.backend.dto.request.ChangePasswordRequest;
import com.stocktrack.backend.dto.request.UpdateProfileRequest;
import com.stocktrack.backend.dto.response.ProfileResponse;
import com.stocktrack.backend.model.User;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface ProfileService {
    ProfileResponse getProfile(Long userId);
    User updateProfile(Long userId, UpdateProfileRequest request);
    void changePassword(Long userId, ChangePasswordRequest request);

    ProfileResponse uploadProfilePicture(Long userId, MultipartFile file)
            throws IOException;

    void deleteProfilePicture(Long userId);
}
