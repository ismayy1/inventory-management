package com.stocktrack.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequest {

    @NotBlank
    @Size(min = 6, max = 40)
    private String currentPassword;

    @NotBlank
    @Size(min = 6, max = 40)
    private String newPassword;

    @NotBlank
    @Size(min = 6, max = 40)
    private String confirmPassword;
}
