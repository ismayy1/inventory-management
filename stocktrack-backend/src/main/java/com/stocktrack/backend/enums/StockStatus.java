package com.stocktrack.backend.enums;

import lombok.Getter;

@Getter
public enum StockStatus {

    OUT_OF_STOCK("Out of Stock"),
    LOW_STOCK("Low Stock"),
    IN_STOCK("In Stock"),
    OVER_STOCK("Overstock");

    private final String displayName;

    StockStatus(String displayName) {
        this.displayName = displayName;
    }
}
