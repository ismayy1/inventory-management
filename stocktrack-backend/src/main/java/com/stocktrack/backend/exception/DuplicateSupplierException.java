package com.stocktrack.backend.exception;

public class DuplicateSupplierException extends RuntimeException {
    private final String field;
    private final String value;

    public DuplicateSupplierException(String field, String value) {
        super("Supplier with " + field + " '" + value + "' already exists.");
        this.field = field;
        this.value = value;
    }

    public String getField() {
        return field;
    }

    public String getValue() {
        return value;
    }
}