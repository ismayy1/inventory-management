package com.stocktrack.backend.dto.request;

import com.stocktrack.backend.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class UpdateUserRequest {

    @Size(min = 3, max = 20)
    private String username;

    @Size(max = 50)
    @Email
    private String email;

    private String firstName;

    private String lastName;

    private String password;

    private Boolean isActive;

    private Set<Role> roles;
}