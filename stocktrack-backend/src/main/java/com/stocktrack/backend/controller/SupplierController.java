package com.stocktrack.backend.controller;

import com.stocktrack.backend.exception.SupplierNotFoundException;
import com.stocktrack.backend.model.Product;
import com.stocktrack.backend.model.Supplier;
import com.stocktrack.backend.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
public class SupplierController {

    @Autowired
    private SupplierService supplierService;

    @GetMapping("/{id}/products")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public List<Product> getSupplierProducts(@PathVariable Long id) {
        return supplierService.getSupplierProducts(id);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'PROCUREMENT')")
    public void deactivateSupplier(
            @PathVariable Long id,
            @RequestParam String username
    ) {
        supplierService.deactivateSupplier(id, username);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public List<Supplier> getAllSuppliers() {
        return supplierService.getAllSuppliers();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public ResponseEntity<Supplier> getSupplierById(@PathVariable Long id) {
        Supplier supplier = supplierService.getSupplierById(id);
        return ResponseEntity.ok(supplier);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT')")
    public ResponseEntity<Supplier> createSupplier(@Valid @RequestBody Supplier supplier) {
        Supplier createdSupplier = supplierService.createSupplier(supplier);
        return ResponseEntity.ok(createdSupplier);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT')")
    public ResponseEntity<Supplier> updateSupplier(@PathVariable Long id, @Valid @RequestBody Supplier supplierDetails) {
        Supplier updatedSupplier = supplierService.updateSupplier(id, supplierDetails);
        return ResponseEntity.ok(updatedSupplier);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public List<Supplier> searchSuppliers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone) {

        if (phone != null && !phone.trim().isEmpty()) {
            return supplierService.searchSuppliersByPhone(phone);
        } else if (name != null && !name.trim().isEmpty()) {
            return supplierService.searchSuppliers(name);
        } else {
            throw new SupplierNotFoundException("Supplier is inActive or doesn't exist: (" + name + " - " + phone + ")");
        }
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public List<Supplier> getActiveSuppliers() {
        return supplierService.getActiveSuppliers();
    }
}
