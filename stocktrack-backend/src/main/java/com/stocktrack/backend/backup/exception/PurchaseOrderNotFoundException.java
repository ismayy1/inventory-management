package com.stocktrack.backend.backup.exception;

public class PurchaseOrderNotFoundException extends RuntimeException {
    public PurchaseOrderNotFoundException(Long id) {
        super("Purchase order not found with id: " + id);
    }
}
