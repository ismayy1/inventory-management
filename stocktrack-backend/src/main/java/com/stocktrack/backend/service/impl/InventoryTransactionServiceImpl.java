package com.stocktrack.backend.service.impl;

import com.stocktrack.backend.dto.InventoryTransactionDTO;
import com.stocktrack.backend.dto.OverstockItemDTO;
import com.stocktrack.backend.enums.StockStatus;
import com.stocktrack.backend.enums.TransactionType;
import com.stocktrack.backend.exception.ProductNotFoundException;
import com.stocktrack.backend.exception.TransactionNotFoundException;
import com.stocktrack.backend.model.InventoryTransaction;
import com.stocktrack.backend.model.Product;
import com.stocktrack.backend.repository.InventoryTransactionRepository;
import com.stocktrack.backend.repository.ProductRepository;
import com.stocktrack.backend.service.InventoryTransactionService;
import com.stocktrack.backend.service.ProductService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
public class InventoryTransactionServiceImpl implements InventoryTransactionService {

    @Autowired
    private InventoryTransactionRepository transactionRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Override
    @Transactional
    public InventoryTransaction createTransaction(InventoryTransactionDTO dto) {

        Product product = productService.getProductById(dto.getProductId())
                .orElseThrow(() -> new ProductNotFoundException(
                        "Product not found with id: " + dto.getProductId()
                ));

        int quantity = dto.getQuantity();

        int currentStock = product.getCurrentStock() != null ? product.getCurrentStock() : 0;
        int soldLast90Days = product.getSoldLast90Days() != null ? product.getSoldLast90Days() : 0;
        int totalLoss = product.getTotalLossQuantity() != null ? product.getTotalLossQuantity() : 0;

        TransactionType type = dto.getTransactionType();

        switch (type) {

            case SALE -> {

                currentStock = safe(product.getCurrentStock());

                int updatedStock = currentStock - quantity;

                // allow reaching exactly 0
                if (updatedStock < 0) {
                    throw new IllegalStateException("Not enough stock available");
                }

                // subtract ONLY ONCE
                product.setCurrentStock(updatedStock);

                int sold = safe(product.getSoldLast90Days());

                product.setSoldLast90Days(sold + quantity);
            }

            case PURCHASE -> {
                currentStock = safe(product.getCurrentStock());
                product.setCurrentStock(currentStock + quantity);
            }

            case RETURN -> {
//                returned items are reSellable
                currentStock = safe(product.getCurrentStock());
                int sold = safe(product.getSoldLast90Days());

                product.setCurrentStock(currentStock + quantity);

//                reverse sales impact
                product.setSoldLast90Days(Math.max(sold - quantity, 0));
            }

            case ADJUSTMENT -> {
//                can be positive OR negative
                currentStock = safe(product.getCurrentStock());
                int updatedStock = currentStock + quantity;

                if (updatedStock < 0) {
                    throw new IllegalStateException("Stock cannot go negative after adjustment");
                }

                product.setCurrentStock(updatedStock);
            }

            case DAMAGED, EXPIRED -> {
                currentStock = safe(product.getCurrentStock());
//                int updatedStock = currentStock - quantity;

                if (currentStock < quantity) {
                    throw new IllegalStateException("Not enough stock to mark as damaged/expired");
                }

                product.setCurrentStock(currentStock - quantity);

                int loss = safe(product.getTotalLossQuantity());
                product.setTotalLossQuantity(loss + quantity);
            }

            case TRANSFER -> {
//                ignored for now
            }
        }

        productRepository.save(product);

        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setProduct(product);
        transaction.setTransactionType(type);
        transaction.setQuantity(quantity);
        transaction.setReferenceNumber(dto.getReferenceNumber());
        transaction.setDescription(dto.getDescription());
        transaction.setCreatedBy(dto.getCreatedBy());

        BigDecimal unitPrice = product.getUnitPrice();
        if (unitPrice == null) {
            throw new IllegalStateException(
                    "Product unit price is missing for product id: " + product.getId()
            );
        }

        transaction.setUnitPrice(unitPrice);
        transaction.setTotalAmount(unitPrice.multiply(BigDecimal.valueOf(quantity)));

        return transactionRepository.save(transaction);
    }

    @Override
    public List<InventoryTransaction> getTransactionsByProductId(Long productId) {
        return transactionRepository.findByProductOrderByCreatedAtDesc(productId);
    }

    @Override
    public List<InventoryTransactionDTO> getTransactionsByType(TransactionType type) {
        List<InventoryTransaction> entities =
                transactionRepository.findByTransactionTypeOrderByCreatedAtDesc(type);
        return entities.stream()
                .map(InventoryTransactionDTO::fromEntity)
                .toList();
    }

    @Override
    public List<InventoryTransactionDTO> getTransactionsByDateRangeDTO(LocalDateTime start, LocalDateTime end) {
        return transactionRepository
                .findByCreatedAtBetweenOrderByCreatedAtDesc(start, end)
                .stream()
                .map(InventoryTransactionDTO::fromEntity)
                .toList();
    }

    @Override
    public List<InventoryTransactionDTO> getRecentTransactionsDTO(int limit) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime since = now.minusDays(7);
        return getTransactionsByDateRangeDTO(since, now).stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Override
    public InventoryTransaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new TransactionNotFoundException("Transaction not found with id: " + id));
    }

    @Override
    public List<InventoryTransaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @Override
    public List<InventoryTransactionDTO> getAllTransactionsDTO() {
        return transactionRepository.findAllTransactionsDTO();
    }

    //    A Method For Over Stock Items Table
    @Override
    public List<OverstockItemDTO> getOverstockItems() {
        List<Product> products = productRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last90Days = now.minusDays(90);

        return products.stream()
                .map(product -> {
                    List<InventoryTransaction> sales = transactionRepository
                            .findByProductAndTransactionTypeAndCreatedAtBetween(
                                    product,
                                    TransactionType.SALE,
                                    last90Days,
                                    now
                            );

                    int totalSold = sales.stream().mapToInt(InventoryTransaction::getQuantity).sum();
                    double avgDailySales = totalSold / 90.0;
                    product.setAvgDailySales90d(avgDailySales);

                    if (product.getStockStatus() != StockStatus.OVER_STOCK) {
                        return null;
                    }

                    double currentStock = product.getCurrentStock();
                    double daysOfSupply = avgDailySales == 0 ? Double.MAX_VALUE : currentStock / avgDailySales;

                    OverstockItemDTO dto = new OverstockItemDTO();
                    dto.setProductId(product.getId());
                    dto.setProductName(product.getName());
                    dto.setCurrentStock((int) currentStock);
                    dto.setMinLevel(product.getReorderThreshold());
                    dto.setAvgDailySales(avgDailySales);
                    dto.setDaysOfSupply(daysOfSupply);
                    return dto;
                })
                .filter(Objects::nonNull)
                .toList();
    }


    private int safe(Integer value) {
        return value != null ? value : 0;
    }
}
