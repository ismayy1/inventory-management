package com.stocktrack.backend.service.impl;

import com.stocktrack.backend.dto.*;
import com.stocktrack.backend.enums.ProductCategory;
import com.stocktrack.backend.enums.TransactionType;
import com.stocktrack.backend.model.InventoryTransaction;
import com.stocktrack.backend.model.Product;
import com.stocktrack.backend.repository.InventoryTransactionRepository;
import com.stocktrack.backend.repository.ProductRepository;
import com.stocktrack.backend.service.InventoryAnalyticsService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InventoryAnalyticsServiceImpl implements InventoryAnalyticsService {

    private final ProductRepository productRepository;
    private final InventoryTransactionRepository transactionRepository;

    public InventoryAnalyticsServiceImpl(
            ProductRepository productRepository,
            InventoryTransactionRepository transactionRepository
    ) {
        this.productRepository = productRepository;
        this.transactionRepository = transactionRepository;
    }

    private double calculateAvgDailySales(Long productId) {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last90Days = now.minusDays(90);

        List<InventoryTransaction> sales =
                transactionRepository.findByProductAndTransactionTypeAndCreatedAtBetween(
                        productRepository.getReferenceById(productId),
                        TransactionType.SALE,
                        last90Days,
                        now
                );

        int totalSold = sales.stream()
                .mapToInt(InventoryTransaction::getQuantity)
                .sum();

        return totalSold / 90.0;
    }

    @Override
    public List<OverstockItemDTO> getOverstockItems() {

        List<Product> products = productRepository.findAll();

        return products.stream()
                .filter(product -> product.getStockStatus()
                        == com.stocktrack.backend.enums.StockStatus.OVER_STOCK)
                .map(product -> {

                    double avgDailySales = calculateAvgDailySales(product.getId());

                    Double daysOfSupply = avgDailySales > 0
                            ? Math.round((product.getCurrentStock() / avgDailySales) * 10.0) / 10.0
                            : null;

                    OverstockItemDTO dto = new OverstockItemDTO();
                    dto.setProductId(product.getId());
                    dto.setProductName(product.getName());
                    dto.setCurrentStock(product.getCurrentStock());
                    dto.setMinLevel(product.getReorderThreshold());
                    dto.setStockStatus(product.getStockStatus());
                    dto.setAvgDailySales(avgDailySales);
                    dto.setDaysOfSupply(daysOfSupply);

                    return dto;
                })
                .toList();
    }

    @Override
    public List<InStockItemDTO> getInStockItems() {

        List<Product> products = productRepository.findAll();

        return products.stream()
                .filter(product ->
                        product.getStockStatus()
                                == com.stocktrack.backend.enums.StockStatus.IN_STOCK)
                .map(product -> {

                    double avgDailySales = calculateAvgDailySales(product.getId());

                    Double daysOfSupply = avgDailySales > 0
                            ? Math.round((product.getCurrentStock() / avgDailySales) * 10.0) / 10.0
                            : null;

                    InStockItemDTO dto = new InStockItemDTO();
                    dto.setProductId(product.getId());
                    dto.setProductName(product.getName());
                    dto.setCurrentStock(product.getCurrentStock());
                    dto.setAvgDailySales(avgDailySales);
                    dto.setMinLevel(product.getReorderThreshold());
                    dto.setDaysOfSupply(daysOfSupply);

                    return dto;
                })
                .toList();
    }


    @Override
    public List<LowStockItemDTO> getLowStockItems() {

        List<Product> products = productRepository.findAll();

        return products.stream()
                .filter(product -> {

                    com.stocktrack.backend.enums.StockStatus status =
                            product.getStockStatus();

                    return status == com.stocktrack.backend.enums.StockStatus.LOW_STOCK
                            || status == com.stocktrack.backend.enums.StockStatus.OUT_OF_STOCK;
                })
                .map(product -> {

                    double avgDailySales = calculateAvgDailySales(product.getId());

                    Double daysOfSupply = avgDailySales > 0
                            ? Math.round((product.getCurrentStock() / avgDailySales) * 10.0) / 10.0
                            : null;

                    LowStockItemDTO dto = new LowStockItemDTO();
                    dto.setProductId(product.getId());
                    dto.setProductName(product.getName());
                    dto.setCurrentStock(product.getCurrentStock());
                    dto.setMinLevel(product.getReorderThreshold());
                    dto.setAvgDailySales(avgDailySales);
                    dto.setDaysOfSupply(daysOfSupply);

                    return dto;
                })
                .toList();
    }

    @Override
    public Map<String, Long> getStockStatusSummary() {

        List<Product> products = productRepository.findAll();

        long inStock = 0;
        long lowStock = 0;
        long outOfStock = 0;
        long overStock = 0;

        for (Product product : products) {
            switch (product.getStockStatus()) {
                case IN_STOCK -> inStock++;
                case LOW_STOCK -> lowStock++;
                case OUT_OF_STOCK -> outOfStock++;
                case OVER_STOCK -> overStock++;
            }
        }

        Map<String, Long> result = new HashMap<>();
        result.put("IN_STOCK", inStock);
        result.put("LOW_STOCK", lowStock);
        result.put("OUT_OF_STOCK", outOfStock);
        result.put("OVER_STOCK", overStock);

        return result;
    }

    @Override
    public List<CategoryChartDTO> getProductCategoryDistribution() {

        List<Product> products = productRepository.findAll();

        Map<String, Long> categoryCount = products.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getCategory() != null
                                ? p.getCategory().name()
                                : "UNCATEGORIZED",
                        Collectors.counting()
                ));

        return categoryCount.entrySet().stream()
                .map(e -> new CategoryChartDTO(
                        e.getKey(),
                        e.getValue()
                ))
                .toList();
    }
}