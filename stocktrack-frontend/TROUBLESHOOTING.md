# Troubleshooting Admin Features Not Showing

## Quick Fix Steps

### 1. Clear Browser Storage
Open your browser's Developer Tools (F12) and run these commands in the Console:

```javascript
// Clear all localStorage
localStorage.clear()

// Clear all sessionStorage  
sessionStorage.clear()

// Reload the page
window.location.reload()
```

### 2. Hard Refresh
- Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- Or press `Ctrl + F5` (Windows/Linux)

### 3. Restart Development Server
```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### 4. Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for any error messages
4. You should see debug logs like:
   - "Setting admin user: {id: 0, username: 'ismai1', role: 'admin', ...}"
   - "Sidebar user: {id: 0, username: 'ismai1', role: 'admin', ...}"
   - "Is admin? true"

### 5. Verify Login Process
1. Go to `/signin`
2. Use credentials: `ismai1` / `ismai1`
3. Check the debug info box in bottom-right corner
4. Verify it shows "Role: admin" and "Is Admin: YES"

### 6. Manual Navigation Test
After logging in, try manually navigating to:
- `http://localhost:5173/dashboard/users`

## What Should Happen

### In Sidebar
You should see:
1. Regular navigation items (Dashboard, Products, etc.)
2. A debug line showing "Role: admin"
3. An "Admin" section header
4. "User Management" link under Admin section

### In Settings Page
You should see:
1. Additional "User Management" tab (only for admin)
2. User creation form and user list table

## If Still Not Working

### Check Network Tab
1. Open Developer Tools → Network tab
2. Look for any failed API requests
3. Check if authentication headers are being sent

### Verify User Object
In the browser console, run:
```javascript
// Check current user
console.log(JSON.parse(localStorage.getItem('user')))

// Should show:
// {
//   id: 0,
//   username: "ismai1", 
//   email: "ismai1@example.com",
//   role: "admin",
//   isActive: true,
//   createdAt: "..."
// }
```

### Force Admin User
If needed, you can manually set the admin user in console:
```javascript
const adminUser = {
  id: 0,
  username: "ismai1",
  email: "ismai1@example.com", 
  role: "admin",
  isActive: true,
  createdAt: new Date().toISOString()
}

localStorage.setItem('user', JSON.stringify(adminUser))
localStorage.setItem('token', 'local-default-token')
window.location.reload()
```

## Common Issues

### 1. Browser Cache
- Old JavaScript files cached
- **Solution**: Hard refresh or clear cache

### 2. Development Server State
- Hot reload not working properly
- **Solution**: Restart dev server

### 3. localStorage Corruption
- Invalid JSON in localStorage
- **Solution**: Clear localStorage

### 4. React State Issues
- Component not re-rendering
- **Solution**: Full page refresh

## Debug Information

The debug box in the bottom-right should show:
```
Debug Info
Loading: false
Token: present  
User: {"id":0,"username":"ismai1","email":"ismai1@example.com","role":"admin","isActive":true,"createdAt":"..."}
Role: admin
Is Admin: YES
```

If any of these values are wrong, that's where the issue is.