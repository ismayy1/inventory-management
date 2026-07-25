package com.stocktrack.backend.service;

import com.stocktrack.backend.enums.StockAdjustmentType;
import com.stocktrack.backend.model.Product;
import com.stocktrack.backend.model.StockAdjustment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface StockAdjustmentService {

    StockAdjustment createStockAdjustment(Long id, StockAdjustmentType type, Integer quantity, String reason, String adjustedBy, String notes);

    List<StockAdjustment> getAdjustmentsByProduct(Long productId);
    List<StockAdjustment> getRecentAdjustments(int limit);
    StockAdjustment getAdjustmentById(Long id);
    List<StockAdjustment> getAllAdjustments();
    StockAdjustment updateStockAdjustment(Long id, Integer quantity, String reason, String notes);
}
