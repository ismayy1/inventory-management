package com.stocktrack.backend.repository;

import com.stocktrack.backend.model.PurchaseOrder;
import com.stocktrack.backend.model.PurchaseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, Long> {

    List<PurchaseOrderItem> findByPurchaseOrderId(Long purchaseOrderId);
}
