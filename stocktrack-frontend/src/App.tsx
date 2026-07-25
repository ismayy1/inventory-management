import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./lib/auth-context"
import { NotificationProvider } from "./lib/notification-context"
import { Toaster } from "./components/ui/toaster"
import { ProtectedRoute } from "./components/protected-route"
import { AdminRoute } from "./components/admin-route"
import { ErrorBoundary } from "./components/error-boundary"
import AddSupplierPage from "./components/dashboard/add-supplier"
import { NewAdjustment } from "./components/dashboard/new-adjustment"
import NewProductPage from "./pages/dashboard/new-product"
import NewTransactionPage from "./pages/dashboard/new-transaction"
import EditProductPage from "./pages/dashboard/edit-product"
import ViewProductPage from "./pages/dashboard/view-product"
import EditSupplierPage from "./pages/dashboard/edit-supplier"
import RevaluateAdjustmentPage from "./pages/dashboard/revaluate-adjustment"

import DashboardLayout from "./pages/dashboard/layout"
import DashboardPage from "./pages/dashboard"
import ProductsPage from "./pages/dashboard/products"
import SuppliersPage from "./pages/dashboard/suppliers"
import AdjustmentsPage from "./pages/dashboard/adjustments"
import TransactionsPage from "./pages/dashboard/transactions"
import AuditLogsPage from "./pages/dashboard/audit-logs"
import BackupsPage from "./pages/dashboard/backups"
import SettingsPage from "./pages/dashboard/settings"
import UsersPage from "./pages/dashboard/users"
import AddUserPage from "./pages/dashboard/add-user"
import EditUserPage from "./pages/dashboard/edit-user"
import ReportsPage from "./pages/dashboard/reports"
import PurchaseOrdersPage from "./pages/dashboard/purchase-orders"
import NewPurchaseOrderPage from "./pages/dashboard/new-purchase-order"
import ViewPurchaseOrderPage from "./pages/dashboard/view-purchase-order"
import SignInPage from "./pages/auth/signin"
import SignUpPage from "./pages/auth/signup"
import ForgotPasswordPage from "./pages/auth/forgot-password"
import DebugPage from "./pages/debug"




function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/debug" element={<DebugPage />} />
            
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/login" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >

              <Route path="suppliers/new" element={<AddSupplierPage />} />
              <Route path="adjustments/new" element={<NewAdjustment />} />
              <Route path="adjustments/:id/revaluate" element={<RevaluateAdjustmentPage />} />
              <Route path="products/new" element={<NewProductPage />} />
              <Route path="transactions/new" element={<NewTransactionPage />} />
              <Route path="products/:id" element={<ViewProductPage />} />
              <Route path="products/:id/edit" element={<EditProductPage />} />
              <Route path="suppliers/:id/edit" element={<EditSupplierPage />} />

              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="adjustments" element={<AdjustmentsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="purchase-orders/new" element={<NewPurchaseOrderPage />} />
              <Route path="purchase-orders/:id" element={<ViewPurchaseOrderPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="backups" element={
                <AdminRoute>
                  <BackupsPage />
                </AdminRoute>
              } />
              <Route path="users" element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              } />
              <Route path="users/add" element={
                <AdminRoute>
                  <AddUserPage />
                </AdminRoute>
              } />
              <Route path="users/:id/edit" element={
                <AdminRoute>
                  <EditUserPage />
                </AdminRoute>
              } />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="*" element={<Navigate to="/signin" replace />} />
          </Routes>
          <Toaster />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App