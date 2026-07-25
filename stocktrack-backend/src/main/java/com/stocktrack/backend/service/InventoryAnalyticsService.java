package com.stocktrack.backend.service;

import com.stocktrack.backend.dto.*;
import com.stocktrack.backend.enums.TransactionType;
import com.stocktrack.backend.model.InventoryTransaction;
import com.stocktrack.backend.model.Product;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface InventoryAnalyticsService {

    List<OverstockItemDTO> getOverstockItems();

    List<InStockItemDTO> getInStockItems();

    List<LowStockItemDTO> getLowStockItems();

    Map<String, Long> getStockStatusSummary();

    List<CategoryChartDTO> getProductCategoryDistribution();
}
