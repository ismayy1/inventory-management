package com.stocktrack.backend.dto;

import com.stocktrack.backend.enums.StockStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OverstockItemDTO {

    private Long productId;
    private String productName;
    private int currentStock;
    private Integer minLevel;
    private Double avgDailySales;
    private Double daysOfSupply;
    private StockStatus stockStatus;
}
