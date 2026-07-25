package com.stocktrack.backend.exception;

public class ProductDuplicateException extends RuntimeException {
    public ProductDuplicateException(String message) {
        super(message);
    }
}
