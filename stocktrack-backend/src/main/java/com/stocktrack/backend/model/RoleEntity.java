package com.stocktrack.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.stocktrack.backend.enums.Role;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Entity
@Table(name = "roles", uniqueConstraints = @UniqueConstraint(columnNames = "name"))
@Getter
@Setter
@AllArgsConstructor
public class RoleEntity {

    @Id
    @Setter(AccessLevel.NONE)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "name", nullable = false, unique = true, length = 50)
    private Role name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToMany(mappedBy = "roles", fetch = FetchType.EAGER)
    @JsonIgnore
    private Set<User> users = new HashSet<>();

    public RoleEntity() {
    }

    public RoleEntity(Role name) {
        this.name = name;
        this.description = switch (name) {
            case SYSTEM_ADMIN -> "Full system access and user management";
            case INVENTORY_MANAGER -> "Manage stock levels and inventory workflows";
            case PROCUREMENT -> "Handle purchasing and supplier management";
            case WAREHOUSE_STAFF -> "Process shipments, receipts, and stock movements";
            case INVENTORY_ANALYST -> "Generate reports and analyze inventory data";
        };
    }

    public void addUser(User user) {
        users.add(user);
        user.getRoles().add(this);
    }

    public void removeUser(User user) {
        users.remove(user);
        user.getRoles().remove(this);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id != null ? id : name);
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof RoleEntity that)) return false;
        if (id != null && that.id != null) return id.equals(that.id);
        return name == that.name;
    }
}
