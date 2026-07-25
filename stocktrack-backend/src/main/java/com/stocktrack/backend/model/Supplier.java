package com.stocktrack.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Table(name = "suppliers")
public class Supplier {

    @Setter
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Supplier name is required!")
    @Column(nullable = false, length = 200, unique = true)
    private String name;

    @Column(length = 500)
    private String address;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Phone number is invalid!")
    @Column(name = "phone", length = 20, unique = true)
    private String phone;

    @Email(message = "Email should be valid!")
    @Column(name = "email", length = 100, unique = true)
    private String email;

    @Column(name = "contact_person", length = 100)
    private String contactPerson;

    @Column(name = "website", length = 200)
    private String website;

    @Column(name = "tax_id", length = 50)
    private String taxId;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Setter
    @Column(name = "is_active", nullable = false)
    private Boolean active = true;

    @Column(name = "deactivated_at")
    private LocalDateTime deactivatedAt;

    @Setter
    @Column(name = "deactivated_by", length = 100)
    private String deactivatedBy;

    @OneToMany(
            mappedBy = "supplier",
            fetch = FetchType.LAZY,
            cascade = CascadeType.PERSIST
    )
    @JsonIgnore
    private List<Product> products = new ArrayList<>();

    public Supplier() {
        this.createdAt = LocalDateTime.now();
    }

    public void addProduct(Product product) {
        products.add(product);
        product.setSupplier(this);
    }

//    //////////////////////////////////////////////
//    bad idea of removing the product when the supplier is removed
    public void removeProduct(Product product) {
        products.remove(product);
        product.setSupplier(null);
    }
//    //////////////////////////////////////////////

    public Supplier(Long id, String name, String address, String phone, String email, String contactPerson,
                    String website, String taxId, String notes, LocalDateTime createdAt, Boolean isActive) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.phone = phone;
        this.email = email;
        this.contactPerson = contactPerson;
        this.website = website;
        this.taxId = taxId;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = LocalDateTime.now();
        this.active = isActive;
    }

    public void setName(String name) {
        this.name = name;
        this.updatedAt = LocalDateTime.now();
    }

    public void setAddress(String address) {
        this.address = address;
        this.updatedAt = LocalDateTime.now();
    }

    public void setPhone(String phone) {
        this.phone = phone;
        this.updatedAt = LocalDateTime.now();
    }

    public void setEmail(String email) {
        this.email = email;
        this.updatedAt = LocalDateTime.now();
    }

    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
        this.updatedAt = LocalDateTime.now();
    }

    public void setWebsite(String website) {
        this.website = website;
        this.updatedAt = LocalDateTime.now();
    }

    public void setTaxId(String taxId) {
        this.taxId = taxId;
        this.updatedAt = LocalDateTime.now();
    }

    public void setNotes(String notes) {
        this.notes = notes;
        this.updatedAt = LocalDateTime.now();
    }

    public void setActive(Boolean active) {
        this.active = active;
        this.updatedAt = LocalDateTime.now();
    }

    public void setDeactivatedBy(String deactivatedBy) {
        this.deactivatedBy = deactivatedBy;
        this.deactivatedAt = LocalDateTime.now();
    }
}
