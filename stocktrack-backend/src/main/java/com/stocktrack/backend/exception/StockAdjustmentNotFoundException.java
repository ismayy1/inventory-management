package com.stocktrack.backend.exception;

public class StockAdjustmentNotFoundException extends RuntimeException {
    public StockAdjustmentNotFoundException(String message) {
        super(message);
    }
}
