package com.stocktrack.backend.service;

import com.stocktrack.backend.dto.InventoryTransactionDTO;
import com.stocktrack.backend.dto.OverstockItemDTO;
import com.stocktrack.backend.enums.TransactionType;
import com.stocktrack.backend.model.InventoryTransaction;
import com.stocktrack.backend.model.Product;

import java.time.LocalDateTime;
import java.util.List;

public interface InventoryTransactionService {
    List<InventoryTransaction> getTransactionsByProductId(Long productId);
    List<InventoryTransactionDTO> getTransactionsByType(TransactionType type);
    List<InventoryTransactionDTO> getTransactionsByDateRangeDTO(LocalDateTime start, LocalDateTime end);
    List<InventoryTransactionDTO> getRecentTransactionsDTO(int limit);
    InventoryTransaction getTransactionById(Long id);
    List<InventoryTransaction> getAllTransactions();
    List<InventoryTransactionDTO> getAllTransactionsDTO();
    InventoryTransaction createTransaction(InventoryTransactionDTO dto);

    List<OverstockItemDTO> getOverstockItems();
}
