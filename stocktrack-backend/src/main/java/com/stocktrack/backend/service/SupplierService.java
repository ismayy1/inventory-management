package com.stocktrack.backend.service;

import com.stocktrack.backend.model.Product;
import com.stocktrack.backend.model.Supplier;

import java.util.List;
import java.util.Optional;

public interface SupplierService {

    List<Supplier> getAllSuppliers();
    Supplier getSupplierById(Long id);
    Supplier createSupplier(Supplier supplier);
    Supplier updateSupplier(Long id, Supplier supplier);
    List<Supplier> searchSuppliers(String name);
    List<Supplier> getActiveSuppliers();
    List<Supplier> searchSuppliersByPhone(String phone);
    List<Product> getSupplierProducts(Long supplierId);
    void deactivateSupplier(Long id, String username);
}
