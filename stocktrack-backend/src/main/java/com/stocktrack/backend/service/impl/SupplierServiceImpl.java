package com.stocktrack.backend.service.impl;

import com.stocktrack.backend.exception.BusinessRuleException;
import com.stocktrack.backend.exception.DuplicateSupplierException;
import com.stocktrack.backend.exception.ResourceNotFoundException;
import com.stocktrack.backend.exception.SupplierNotFoundException;
import com.stocktrack.backend.model.Product;
import com.stocktrack.backend.model.Supplier;
import com.stocktrack.backend.repository.ProductRepository;
import com.stocktrack.backend.repository.SupplierRepository;
import com.stocktrack.backend.service.SupplierService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
public class SupplierServiceImpl implements SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;
    @Autowired
    private ProductRepository productRepository;

    @Override
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @Override
    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new SupplierNotFoundException("Supplier not found with id: " + id));
    }

    @Override
    public Supplier createSupplier(Supplier supplier) {
//        check for duplicate by name
        if (supplierRepository.findByNameIgnoreCase(supplier.getName()).isPresent()) {
            throw new DuplicateSupplierException("name", supplier.getName());
        }

//        check for duplicate by email
        if (supplier.getEmail() != null && !supplier.getEmail().isEmpty()) {
            if (supplierRepository.findByEmailIgnoreCase(supplier.getEmail()).isPresent()) {
                throw new DuplicateSupplierException("email", supplier.getEmail());
            }
        }

//        check for duplicate by phone
        if (supplier.getPhone() != null && !supplier.getPhone().isEmpty()) {
            if (supplierRepository.findByPhoneIgnoreCase(supplier.getPhone()).isPresent()) {
                throw new DuplicateSupplierException("phone", supplier.getPhone());
            }
        }

        return supplierRepository.save(supplier);
    }

    @Override
    public Supplier updateSupplier(Long id, Supplier supplierDetails) {

        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new SupplierNotFoundException("Supplier not found with id: " + id));

        if (supplier.getActive() && Boolean.FALSE.equals(supplierDetails.getActive())) {
            supplier.setDeactivatedBy("admin");
        }

        supplier.setName(supplierDetails.getName());
        supplier.setAddress(supplierDetails.getAddress());
        supplier.setPhone(supplierDetails.getPhone());
        supplier.setEmail(supplierDetails.getEmail());
        supplier.setContactPerson(supplierDetails.getContactPerson());
        supplier.setWebsite(supplierDetails.getWebsite());
        supplier.setTaxId(supplierDetails.getTaxId());
        supplier.setNotes(supplierDetails.getNotes());
        supplier.setActive(supplierDetails.getActive());

        return supplierRepository.save(supplier);
    }

    @Override
    public List<Supplier> searchSuppliers(String name) {
        return supplierRepository.findByNameContainingIgnoreCaseAndActiveTrue(name);
    }

    //    admin search only - to get all the suppliers (ACTIVE/PASSIVE)
    public List<Supplier> searchAllSuppliers(String name) {
        return supplierRepository.findByNameContainingIgnoreCase(name);
    }

    @Override
    public List<Supplier> getActiveSuppliers() {
        return supplierRepository.findByActiveTrue();
    }

    @Override
    public List<Supplier> searchSuppliersByPhone(String phone) {
        List<Supplier> suppliers = supplierRepository.findByPhoneContaining(phone);

        if (suppliers.isEmpty()) {
            throw new SupplierNotFoundException(
                    "No suppliers found with phone number containing: " + phone
            );
        }

        return suppliers;
    }

    public List<Product> getSupplierProducts(Long supplierId) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new ResourceNotFoundException("Supplier not found");
        }
        return productRepository.findBySupplierId(supplierId);
    }

    public void deactivateSupplier(Long id, String username) {

        Supplier supplier = getSupplierById(id);

        if (!supplier.getProducts().isEmpty()) {
            throw new BusinessRuleException("Cannot deactivate supplier with active products");
        }

        supplier.setActive(false);
        supplier.setDeactivatedBy(username);

        supplierRepository.save(supplier);
    }
}
