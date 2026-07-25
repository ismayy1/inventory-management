package com.stocktrack.backend.enums;

import lombok.Getter;

@Getter
public enum ProductCategory {

    GENERAL("General"),
    FOOD("Food & Beverages"),
    ELECTRONICS("Electronics"),
    CLOTHING("Clothing"),
    BOOKS("Books"),
    BEAUTY("Beauty & Personal Care"),
    HOME("Home & Garden"),
    TOYS("Toys & Games"),
    SPORTS("Sports & Outdoors");

    private final String displayName;

    ProductCategory(String displayName) {
        this.displayName = displayName;
    }
}
