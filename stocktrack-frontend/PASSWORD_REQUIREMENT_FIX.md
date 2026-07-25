# Password Requirement Fix

## Problem
The password field was required when editing users, which should not be the case. Password should only be required when creating new users.

## Solution Implemented

### 1. Edit User Dialog (`users.tsx`)
**Before:**
```typescript
<Input 
    id="edit-password" 
    name="password" 
    type="password"
    required={resetPassword}  // ❌ This made password required when reset toggle was on
    placeholder="Enter new password"
/>
```

**After:**
```typescript
<Input 
    id="edit-password" 
    name="password" 
    type="password"
    placeholder="Enter new password"  // ✅ No required attribute - password is optional
/>
```

### 2. Form Validation Logic
**Added client-side validation:**
```typescript
// Check if password is required when reset is requested
if (resetPassword) {
    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string
    if (!password || password.trim() === "") {
        toast({
            title: "Error",
            description: "Please enter a new password",
            variant: "destructive",
        })
        return
    }
}
```

### 3. Create User Dialog (Unchanged)
**Remains correct:**
```typescript
<Input id="password" name="password" type="password" required />
// ✅ Password is required when creating new users
```

### 4. User Form Component (Already Correct)
**Already had proper logic:**
```typescript
<Input
    required={!user}  // ✅ Required only when creating (no user), optional when editing
    placeholder={user ? "Password (leave blank to keep current)" : "Password"}
/>
```

## Behavior Summary

| Scenario | Password Required | Validation |
|----------|------------------|------------|
| **Creating New User** | ✅ Yes | HTML required + form validation |
| **Editing User (no reset)** | ❌ No | Password field not shown |
| **Editing User (with reset)** | ✅ Yes | Client-side validation when reset toggle is on |

## Key Improvements

1. **Intuitive UX**: Password only required when actually needed
2. **Clear Validation**: Proper error messages for each scenario  
3. **Consistent Behavior**: Same logic across all user forms
4. **Flexible Reset**: Users can choose to reset password or keep current one

## Testing Scenarios

✅ **Create User**: Password field is required and validated
✅ **Edit User (no reset)**: No password field shown, no validation
✅ **Edit User (reset on, empty password)**: Shows error message
✅ **Edit User (reset on, with password)**: Updates password successfully
✅ **Edit User (reset off)**: Updates user info without touching password

The password requirement logic now matches the expected user experience.