package com.stocktrack.backend.repository;

import com.stocktrack.backend.dto.InventoryTransactionDTO;
import com.stocktrack.backend.enums.TransactionType;
import com.stocktrack.backend.model.InventoryTransaction;
import com.stocktrack.backend.model.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    @Query("SELECT new com.stocktrack.backend.dto.InventoryTransactionDTO(" +
            "it.id, it.product.id, it.product.name, it.transactionType, it.quantity, " +
            "it.unitPrice, it.totalAmount, it.referenceNumber, it.description, " +
            "it.createdAt, it.createdBy) " +
            "FROM InventoryTransaction it ORDER BY it.createdAt DESC")
    List<InventoryTransactionDTO> findAllTransactionsDTO();

    @Query("SELECT t FROM InventoryTransaction t WHERE t.product.id = :productId ORDER BY t.createdAt DESC")
    List<InventoryTransaction> findByProductOrderByCreatedAtDesc(@Param("productId") Long productId);
    List<InventoryTransaction> findByTransactionTypeOrderByCreatedAtDesc(TransactionType transactionType);
    List<InventoryTransaction> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    @Query("SELECT t FROM InventoryTransaction t ORDER BY t.createdAt DESC")
    List<InventoryTransaction> findTopNOrderByCreatedAtDesc(Pageable pageable);

    List<InventoryTransaction> findByProductAndTransactionTypeAndCreatedAtBetween(
            Product product,
            TransactionType transactionType,
            LocalDateTime start,
            LocalDateTime end
    );

    List<InventoryTransaction> findByTransactionTypeAndCreatedAtBetween(
            TransactionType transactionType,
            LocalDateTime start,
            LocalDateTime end
    );
}
