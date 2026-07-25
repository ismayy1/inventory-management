package com.stocktrack.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class PurchaseOrderItemRequest {

    private Long productId;

    @JsonProperty("quantity")
    private Integer quantityOrdered;

    private LocalDate expectedDeliveryDate;
}
