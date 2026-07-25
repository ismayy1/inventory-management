package com.stocktrack.backend.exception;

import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpStatus;

@Getter
@Setter
public class ErrorResponse {

    private String error;
    private String message;
    private int status;

    public ErrorResponse(String error, String message) {
        this.error = error;
        this.message = message;
        this.status = HttpStatus.INTERNAL_SERVER_ERROR.value(); // default
    }

    public ErrorResponse(String error, String message, HttpStatus status) {
        this.error = error;
        this.message = message;
        this.status = status.value();
    }
}
