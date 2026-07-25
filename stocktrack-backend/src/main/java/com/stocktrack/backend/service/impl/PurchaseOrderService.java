package com.stocktrack.backend.service.impl;

import com.stocktrack.backend.dto.request.CreatePurchaseOrderRequest;
import com.stocktrack.backend.dto.request.PurchaseOrderItemRequest;
import com.stocktrack.backend.dto.response.PurchaseOrderDetailsResponse;
import com.stocktrack.backend.dto.response.PurchaseOrderItemResponse;
import com.stocktrack.backend.dto.response.PurchaseOrderListResponse;
import com.stocktrack.backend.enums.PurchaseOrderStatus;
import com.stocktrack.backend.enums.TransactionType;
import com.stocktrack.backend.model.*;
import com.stocktrack.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository itemRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;

    @Transactional
    public PurchaseOrder create(CreatePurchaseOrderRequest request) {

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        PurchaseOrder po = new PurchaseOrder();
        po.setSupplier(supplier);
        po.setOrderDate(LocalDate.now());
        po.setStatus(PurchaseOrderStatus.DRAFT);

        // generate PO number (simple version)
        po.setPoNumber("PO-" + System.currentTimeMillis());

        purchaseOrderRepository.save(po);

        BigDecimal total = BigDecimal.ZERO;

//        =======================================
//        PurchaseOrder po = new PurchaseOrder();

//        po.setPoNumber(generatePoNumber());
        po.setOrderDate(LocalDate.now());

        po.setExpectedDeliveryDate(
                request.getExpectedDeliveryDate()
        );

        po.setSupplier(supplier);

//  ===============================================
        for (PurchaseOrderItemRequest itemReq : request.getItems()) {

            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setPurchaseOrder(po);
            item.setProduct(product);
            item.setQuantityOrdered(itemReq.getQuantityOrdered());
            item.setQuantityReceived(0);
            item.setUnitPrice(product.getUnitPrice());

            itemRepository.save(item);

            total = total.add(item.getLineTotal());
        }

        po.setTotalAmount(total);

        return purchaseOrderRepository.save(po);
    }

    @Transactional
    public PurchaseOrderListResponse receiveOrder(Long purchaseOrderId) {

        PurchaseOrder po = purchaseOrderRepository.findById(purchaseOrderId)
                .orElseThrow(() -> new RuntimeException("PO not found"));

        List<PurchaseOrderItem> items = itemRepository.findAll()
                .stream()
                .filter(i -> i.getPurchaseOrder().getId().equals(po.getId()))
                .toList();

        for (PurchaseOrderItem item : items) {

            Product product = item.getProduct();

            int newStock = product.getCurrentStock() + item.getQuantityOrdered();
            product.setCurrentStock(newStock);

            productRepository.save(product);

            InventoryTransaction tx = new InventoryTransaction();
            tx.setProduct(product);
            tx.setTransactionType(TransactionType.PURCHASE);
            tx.setQuantity(item.getQuantityOrdered());
            tx.setUnitPrice(item.getUnitPrice());

            tx.setTotalAmount(
                    item.getUnitPrice()
                            .multiply(BigDecimal.valueOf(item.getQuantityOrdered()))
            );

            tx.setReferenceNumber(po.getPoNumber());
            tx.setDescription("Purchase Order received");

            transactionRepository.save(tx);
        }

        po.setStatus(PurchaseOrderStatus.RECEIVED);
        purchaseOrderRepository.save(po);

        return toListDto(po);
    }

    public List<PurchaseOrderListResponse> getAll() {
        return purchaseOrderRepository.findAll()
                .stream()
                .map(this::toListDto)
                .toList();
    }

    public PurchaseOrderDetailsResponse getById(Long id) {

        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PO not found"));

        List<PurchaseOrderItem> items =
                purchaseOrderItemRepository.findByPurchaseOrderId(id);

        return toDetailsDto(po, items);
    }

    @Transactional
    public PurchaseOrderListResponse cancelOrder(Long purchaseOrderId) {

        PurchaseOrder po = purchaseOrderRepository.findById(purchaseOrderId)
                .orElseThrow(() -> new RuntimeException("PO not found"));

        // prevent cancelling already received orders
        if (po.getStatus() == PurchaseOrderStatus.RECEIVED) {
            throw new RuntimeException("Received purchase orders cannot be cancelled");
        }

        // prevent cancelling twice
        if (po.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new RuntimeException("Purchase order is already cancelled");
        }

        po.setStatus(PurchaseOrderStatus.CANCELLED);

        purchaseOrderRepository.save(po);

        return toListDto(po);
    }

//    helper methods
    private PurchaseOrderListResponse toListDto(PurchaseOrder po) {

        PurchaseOrderListResponse dto = new PurchaseOrderListResponse();

        dto.setId(po.getId());
        dto.setPoNumber(po.getPoNumber());
        dto.setOrderDate(po.getOrderDate());
        dto.setStatus(po.getStatus().name());

        dto.setExpectedDeliveryDate(
                po.getExpectedDeliveryDate()
        );

        dto.setSupplierId(po.getSupplier().getId());
        dto.setSupplierName(po.getSupplier().getName());

        dto.setTotalAmount(po.getTotalAmount());

        return dto;
    }

    private PurchaseOrderDetailsResponse toDetailsDto(
            PurchaseOrder po,
            List<PurchaseOrderItem> items
    ) {
        PurchaseOrderDetailsResponse dto = new PurchaseOrderDetailsResponse();

        dto.setId(po.getId());
        dto.setPoNumber(po.getPoNumber());
        dto.setOrderDate(po.getOrderDate());
        dto.setStatus(po.getStatus().name());

        dto.setExpectedDeliveryDate(
                po.getExpectedDeliveryDate()
        );

        dto.setSupplierId(po.getSupplier().getId());
        dto.setSupplierName(po.getSupplier().getName());

        dto.setTotalAmount(po.getTotalAmount());

        dto.setItems(
                items.stream()
                        .map(this::toItemDto)
                        .toList()
        );

        return dto;
    }

    private PurchaseOrderItemResponse toItemDto(PurchaseOrderItem item) {

        PurchaseOrderItemResponse dto = new PurchaseOrderItemResponse();

        dto.setProductId(item.getProduct().getId());
        dto.setProductName(item.getProduct().getName());

        dto.setQuantity(item.getQuantityOrdered());
        dto.setUnitPrice(item.getUnitPrice());

        dto.setLineTotal(
                item.getUnitPrice()
                        .multiply(BigDecimal.valueOf(item.getQuantityOrdered()))
        );

        return dto;
    }
}
