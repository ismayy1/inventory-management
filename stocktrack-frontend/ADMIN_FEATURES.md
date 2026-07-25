# Admin User Management Features

## Overview
This implementation adds comprehensive admin-only user management functionality to the StockTrack application. When a user with admin role logs in, they get access to additional endpoints and UI features for managing system users.

## Features Implemented

### 1. Admin-Only Navigation
- **User Management** menu item appears in sidebar only for admin users
- Located in the "Admin" section of the sidebar
- Uses `UserCog` icon for clear identification

### 2. User Management Page (`/dashboard/users`)
- **Access Control**: Only accessible to users with `role: "admin"`
- **Full CRUD Operations**:
  - **Create**: Add new users with username, email, password, and role
  - **Read**: View all users with their details (ID, username, email, role, status, created date)
  - **Update**: Edit user information (username, email, role)
  - **Delete**: Both soft delete (deactivate) and hard delete (permanent removal)

### 3. User Operations
- **View User Details**: Modal dialog showing complete user information
- **Edit User**: Update username, email, and role
- **Soft Delete**: Deactivate user (can be restored later)
- **Hard Delete**: Permanently remove user from system
- **Restore User**: Reactivate previously deactivated users

### 4. API Endpoints
Updated `userApi` with comprehensive endpoints:
```typescript
userApi.getAll()           // Get all users
userApi.getById(id)        // Get user by ID
userApi.create(data)       // Create new user
userApi.update(id, data)   // Update user
userApi.softDelete(id)     // Deactivate user
userApi.hardDelete(id)     // Permanently delete user
userApi.restore(id)        // Restore deactivated user
userApi.toggleStatus(id, isActive) // Toggle user status
```

### 5. Enhanced User Model
Extended User interface to support soft delete:
```typescript
interface User {
    id: number
    username: string
    email: string
    role: string
    isActive?: boolean    // New field for soft delete
    createdAt: string
    updatedAt?: string    // New field for tracking updates
}
```

### 6. Access Control Components
- **AdminRoute**: Wrapper component that restricts access to admin-only pages
- **Access Denied UI**: User-friendly message for non-admin users
- **Role-based Navigation**: Dynamic sidebar based on user role

### 7. Settings Page Integration
- Admin users see additional "User Management" tab in settings
- Quick user creation and status management
- Integrated with existing settings workflow

## Security Features

### 1. Role-Based Access Control
- All admin features check `user.role === "admin"`
- Non-admin users see access denied message
- Routes are protected at component level

### 2. Self-Protection
- Admin users cannot delete or deactivate themselves
- Current user is clearly identified in user lists
- Prevents accidental self-lockout

### 3. Soft Delete Safety
- Soft delete allows user recovery
- Clear distinction between deactivate and permanent delete
- Confirmation dialogs for destructive operations

## UI/UX Features

### 1. Status Indicators
- **Active/Inactive badges** for user status
- **Role badges** with different colors (admin = red, user = gray)
- **Visual feedback** for all operations

### 2. Confirmation Dialogs
- **Delete confirmation** with clear warnings
- **Different messages** for soft vs hard delete
- **User information display** in confirmation dialogs

### 3. Form Validation
- **Required field validation** for user creation
- **Email format validation**
- **Password requirements** for new users

### 4. Loading States
- **Loading indicators** during API operations
- **Disabled states** to prevent double-submission
- **Toast notifications** for success/error feedback

## Usage

### For Admin Users
1. **Login** with admin credentials (default: `ismai1` / `ismai1`)
2. **Navigate** to "User Management" in the sidebar
3. **Create users** using the "Add User" button
4. **Manage existing users** through the data table actions
5. **View user details** by clicking the eye icon
6. **Edit users** by clicking the edit icon
7. **Deactivate/Delete users** using the respective action buttons

### For Regular Users
- Regular users see the standard interface without admin features
- No access to user management functionality
- Attempting to access admin routes shows access denied message

## Technical Implementation

### 1. Component Structure
```
src/
├── components/
│   ├── admin-route.tsx           # Admin access control
│   └── dashboard/
│       └── user-form.tsx         # Reusable user form
├── pages/
│   └── dashboard/
│       └── users.tsx             # Main user management page
└── lib/
    └── api.ts                    # Updated with user endpoints
```

### 2. Route Configuration
```typescript
// Admin-protected route in App.tsx
<Route path="users" element={
  <AdminRoute>
    <UsersPage />
  </AdminRoute>
} />
```

### 3. API Integration
All user operations are integrated with the backend API at `/api/users/*` endpoints with proper authentication headers.

## Future Enhancements
- **Bulk operations** (bulk delete, bulk role change)
- **User activity logs** and audit trails
- **Advanced filtering** and search capabilities
- **User permissions** beyond just admin/user roles
- **Password reset** functionality for admins
- **User import/export** features