package com.stocktrack.backend.enums;

import lombok.Getter;

@Getter
public enum StockAdjustmentType {

    INCREMENT("IN"),
    DECREMENT("OUT"),
    MANUAL("MANUAL"),
    CORRECTION("CORRECTION");

    private final String code;

    StockAdjustmentType(String code) {
        this.code = code;
    }
}
