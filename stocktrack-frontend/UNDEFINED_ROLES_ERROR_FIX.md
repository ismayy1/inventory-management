# Fix for "Cannot read properties of undefined (reading 'roles')" Error

## Problem
The error occurs when the code tries to access the `roles` property on an undefined user object. This typically happens when:
1. Corrupted data in localStorage
2. User object is undefined during initialization
3. API response doesn't match expected format

## Root Cause
The error is likely caused by corrupted localStorage data from previous versions of the application that didn't have the `roles` array structure.

## Solution Applied

### 1. Enhanced Null Checks
Added comprehensive null checks throughout the codebase:

**Auth Context:**
```typescript
// Check response and user before accessing properties
if (!response || !response.user) {
    throw new Error("Login failed: no user returned from API")
}

// Safe access to roles property
role: (response.user.roles && response.user.roles.length > 0) 
    ? response.user.roles[0] 
    : response.user.role || 'USER'
```

**User API:**
```typescript
// Safe mapping with null checks
role: (user && user.roles && user.roles.length > 0) 
    ? user.roles[0] 
    : user?.role || 'USER'
```

**Users Page:**
```typescript
// Safe role display with null checks
if (user && user.roles && user.roles.length > 0) {
    return user.roles.map(role => getRoleDisplayName(role)).join(', ')
}
return getRoleDisplayName(user?.role || 'USER')
```

### 2. Enhanced Error Handling
- Clear localStorage when parsing fails
- Normalize user data structure during initialization
- Fallback to default values when properties are missing

### 3. Immediate Fix
**Clear localStorage to remove corrupted data:**

1. Open browser console (F12)
2. Run: `localStorage.clear()`
3. Refresh the page
4. Login again

## Prevention
The enhanced null checks prevent this error from occurring in the future, even if the backend response format changes or localStorage contains unexpected data.

## Files Modified
- `src/lib/auth-context.tsx` - Enhanced initialization and login
- `src/lib/api.ts` - Added null checks in userApi methods
- `src/pages/dashboard/users.tsx` - Safe property access
- `src/lib/utils.ts` - Enhanced admin check with null safety

The application should now handle undefined user objects gracefully and provide proper fallbacks.