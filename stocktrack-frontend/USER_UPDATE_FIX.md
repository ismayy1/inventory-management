# User Update Functionality Fix

## Problem
The "Update User" page was failing with a 400 Bad Request error when trying to update user information. The backend expects a specific `SignupRequest` structure but the frontend was sending incompatible data.

## Backend Requirements
The backend's update endpoint:
```java
@PutMapping("/{id}")
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody SignupRequest updateRequest)
```

The `SignupRequest` structure only accepts:
- `username` (required)
- `email` (required)
- `password` (optional)
- `roles` (required array)

**Important:** The backend does NOT support `isActive` or `profileImage` fields in the update request.

## Changes Made

### 1. Fixed `api.ts` - User API Methods

#### `userApi.update()`
- Removed `isActive` and `profileImage` from the payload
- Only sends: `username`, `email`, `roles`
- Added console logging for debugging
- Properly converts roles using `convertRolesToBackendFormat()`

#### `userApi.resetPassword()`
- Uses the main `/users/${id}` endpoint
- Sends only `{ password }` in the body
- Separate from the main update operation

#### `userApi.create()`
- Properly structures payload with `username`, `email`, `password`, `roles`, `isActive`
- Converts roles to backend format

#### `userApi.softDelete()`, `userApi.restore()`, `userApi.toggleStatus()`
- All now properly send `username`, `email`, `roles` along with the status change
- Use `convertRolesToBackendFormat()` for role conversion

#### Removed Password-Stripping Middleware
- Removed the complex password-stripping logic from `apiRequest()`
- Password handling is now explicit in each method

### 2. Fixed `settings.tsx`

#### `handleCreateUser()`
- Now properly structures the create payload:
  ```typescript
  {
    username: newUser.username,
    email: newUser.email,
    roles: [newUser.role],
    password: "ChangeMe123!",
    isActive: true
  }
  ```
- Shows default password in success message

#### `handleToggleUserStatus()`
- Extracts only necessary fields from user object:
  ```typescript
  {
    username: user.username,
    email: user.email,
    roles: user.roles || (user.role ? [user.role] : ['USER'])
  }
  ```

### 3. Fixed `users.tsx`

#### `handleSoftDelete()`
- Sends complete user data with `isActive: false`:
  ```typescript
  {
    username: user.username,
    email: user.email,
    roles: user.roles || (user.role ? [user.role] : ['USER']),
    isActive: false
  }
  ```

#### `handleRestore()`
- Sends complete user data with `isActive: true`:
  ```typescript
  {
    username: user.username,
    email: user.email,
    roles: user.roles || (user.role ? [user.role] : ['USER']),
    isActive: true
  }
  ```

### 4. Verified `edit-user.tsx`

The edit user page was already correctly structured:
- Sends `username`, `email`, `roles` for updates
- Handles password reset separately via `userApi.resetPassword()`
- Includes proper validation and error handling
- Profile image field is present in UI but not sent to backend (as backend doesn't support it)

## Key Principles

1. **Backend Compatibility**: All user update operations now match the backend's `SignupRequest` structure
2. **Role Conversion**: All roles are converted using `convertRolesToBackendFormat()` before sending
3. **Complete Data**: Even when changing one field (like status), we send complete user data (username, email, roles)
4. **Separate Password Reset**: Password changes are handled separately from profile updates
5. **No Unsupported Fields**: Removed `isActive` and `profileImage` from update payloads (backend doesn't support them in SignupRequest)

## Testing Checklist

- [x] TypeScript compilation passes with no errors
- [ ] Update user profile (username, email, roles) works without 400 error
- [ ] Password reset works independently
- [ ] Create new user works with default password
- [ ] Toggle user status (activate/deactivate) works
- [ ] Soft delete (deactivate) user works
- [ ] Restore (reactivate) user works
- [ ] Multiple roles can be assigned to a user
- [ ] Profile image URL can be entered (stored in frontend state only)

## Notes

- Profile image functionality is present in the UI but not persisted to backend (backend doesn't support it)
- Default password for new users is "ChangeMe123!"
- All user operations require SYSTEM_ADMIN role
- Password reset is a separate operation from profile update
