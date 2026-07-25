package com.stocktrack.backend.enums;

import lombok.Getter;

@Getter
public enum TransactionType {

    PURCHASE("Purchase"),
    SALE("Sale"),
    RETURN("Return"),
    ADJUSTMENT("Adjustment"),
    TRANSFER("Transfer"),
    DAMAGED("Damaged"),
    EXPIRED("Expired");

    private final String displayName;

    TransactionType(String displayName) {
        this.displayName = displayName;
    }
}
