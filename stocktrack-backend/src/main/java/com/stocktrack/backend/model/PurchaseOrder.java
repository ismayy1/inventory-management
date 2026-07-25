package com.stocktrack.backend.model;

import com.stocktrack.backend.enums.PurchaseOrderStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "purchase_orders")
@Getter
@Setter
public class PurchaseOrder {

    @Id
    @GeneratedValue
    private Long id;

    private String poNumber;

    private LocalDate orderDate;

    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    private PurchaseOrderStatus status;

    @ManyToOne
    private Supplier supplier;

    @OneToMany(mappedBy = "purchaseOrder")
    private List<PurchaseOrderItem> items;

    @Column(name = "expected_delivery_date")
    private LocalDate expectedDeliveryDate;
}