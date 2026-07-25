import { assertValidDateRange } from "./date-utils"

const API_BASE_URL = "http://localhost:8080/api"

function convertRoleToBackendFormat(role: string): string {
    if (!role) {
        return role
    }

    const cleanRole = role.replace(/^ROLE_/, "")

    const roleMapping: { [key: string]: string } = {
        'USER': 'USER',
        'SYSTEM_ADMIN': 'SYSTEM_ADMIN',
        'INVENTORY_MANAGER': 'INVENTORY_MANAGER',
        'PROCUREMENT': 'PROCUREMENT',
        'WAREHOUSE_STAFF': 'WAREHOUSE_STAFF',
        'INVENTORY_ANALYST': 'INVENTORY_ANALYST'
    }

    const converted = roleMapping[cleanRole.toUpperCase()] || cleanRole.toUpperCase()
    return converted
}

function convertRolesToBackendFormat(roles: string[]): string[] {
    return roles.map(role => convertRoleToBackendFormat(role))
}

interface ApiOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
    body?: unknown
    headers?: Record<string, string>
    auth?: boolean
}

export async function apiRequest<T>(
    endpoint: string,
    options: ApiOptions = {}
): Promise<T> {

    const {
        method = "GET",
        body,
        headers = {},
        auth = true,
    } = options

    let token = localStorage.getItem("token")

    if (token === "null" || token === "undefined") {
        token = null
    }

    const finalHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...headers,
    }

    if (auth && token) {
        finalHeaders["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
        const text = await response.text()
        let message = `Request failed with status ${response.status}`
        if (text) {
            try {
                const json = JSON.parse(text)
                // Extract message from common backend error shapes
                message = json.message || json.error || json.detail || json.errorMessage || text
            } catch {
                message = text
            }
        }
        throw new Error(message)
    }

    const text = await response.text()

    if (!text) {
        return {} as T
    }

    try {
        const parsed = JSON.parse(text)
        return parsed
    } catch {
        return text as unknown as T
    }
}



function normalizeListResponse<T>(result: any): T[] {
    if (Array.isArray(result)) {
        return result as T[]
    }

    if (result && typeof result === "object") {
        if (Array.isArray(result.content)) {
            return result.content as T[]
        }
        if (Array.isArray(result.data)) {
            return result.data as T[]
        }
        if (Array.isArray(result.items)) {
            return result.items as T[]
        }
    }

    return [] as T[]
}

function normalizeInventoryClassifiedItem(item: any): InventoryClassifiedItem {
    if (!item || typeof item !== "object") {
        return item
    }

    const normalized: any = { ...item }

    if (item.product_name !== undefined && normalized.productName === undefined) {
        normalized.productName = item.product_name
    }
    if (item.current_stock !== undefined && normalized.currentStock === undefined) {
        normalized.currentStock = item.current_stock
    }
    if (item.reorder_threshold !== undefined && normalized.reorderThreshold === undefined) {
        normalized.reorderThreshold = item.reorder_threshold
    }
    if (item.min_level !== undefined && normalized.minLevel === undefined) {
        normalized.minLevel = item.min_level
    }
    if (item.minLevel !== undefined && normalized.minLevel === undefined) {
        normalized.minLevel = item.minLevel
    }
    if (normalized.minLevel === undefined && normalized.reorderThreshold !== undefined) {
        normalized.minLevel = normalized.reorderThreshold
    }
    if (normalized.reorderThreshold === undefined && normalized.minLevel !== undefined) {
        normalized.reorderThreshold = normalized.minLevel
    }
    if (item.avg_daily_sales !== undefined && normalized.avgDailySales === undefined) {
        normalized.avgDailySales = item.avg_daily_sales
    }
    if (item.days_of_supply !== undefined && normalized.daysOfSupply === undefined) {
        normalized.daysOfSupply = item.days_of_supply
    }
    if (item.stock_status !== undefined && normalized.status === undefined) {
        normalized.status = item.stock_status
    }
    if (item.sku !== undefined && normalized.sku === undefined) {
        normalized.sku = item.sku
    }

    return normalized
}

export const authApi = {

    signIn: async (credentials: { username: string; password: string }) => {
        const response = await apiRequest<any>("/auth/signin", {
            method: "POST",
            body: credentials,
            auth: false,
        })

        if (response.token && response.user) {
            return response
        } else if (response.accessToken && response.user) {
            return { token: response.accessToken, user: response.user }
        } else if (response.jwt && response.user) {
            return { token: response.jwt, user: response.user }
        } else if (response.token && response.username) {
            return {
                token: response.token,
                user: {
                    id: response.id,
                    username: response.username,
                    email: response.email,
                    role: response.role,
                    roles: response.roles,
                    isActive: response.isActive,
                    createdAt: response.createdAt,
                    firstName: response.firstName,
                    lastName: response.lastName,
                    fullName: response.fullName,
                    lastLogin: response.lastLogin
                }
            }
        } else {
            return response
        }
    },

    signUp: (data: { username: string; email: string; password: string }) =>
        apiRequest<{ message: string }>("/auth/signup", {
            method: "POST",
            body: data,
            auth: false,
        }),

    signOut: async () => {
        try {
            await apiRequest<void>("/auth/signout", { method: "POST" })
        } finally {
            localStorage.removeItem("token")
        }
    },

    forgotPassword: (email: string) =>
        apiRequest<{ message: string }>("/auth/forgot-password", {
            method: "POST",
            body: { email },
            auth: false,
        }),

    resetPassword: (data: { token: string; password: string }) =>
        apiRequest<{ message: string }>("/auth/reset-password", {
            method: "POST",
            body: data,
            auth: false,
        }),
}

export const productApi = {

    getAll: () => apiRequest<Product[]>("/products"),

    getById: (id: number) =>
        apiRequest<Product>(`/products/${id}`),

    create: (supplierId: number, data: Partial<Product>) =>
        apiRequest<Product>(`/products/${supplierId}`, {
            method: "POST",
            body: data,
        }),

    update: (id: number, data: Partial<Product>) =>
        apiRequest<Product>(`/products/${id}`, {
            method: "PUT",
            body: data,
        }),

    delete: (id: number) =>
        apiRequest<void>(`/products/${id}`, {
            method: "DELETE",
        }),

    search: (name: string) =>
        apiRequest<Product[]>(
            `/products/search?name=${encodeURIComponent(name)}`
        ),

    getOutOfStock: () =>
        apiRequest<Product[]>("/products/out-of-stock"),

    getLowStock: () =>
        apiRequest<Product[]>("/products/low-stock"),
}

export const supplierApi = {

    getAll: () => apiRequest<Supplier[]>("/suppliers"),

    getActive: () =>
        apiRequest<Supplier[]>("/suppliers/active"),

    getById: (id: number) =>
        apiRequest<Supplier>(`/suppliers/${id}`),

    create: (data: Partial<Supplier>) =>
        apiRequest<Supplier>("/suppliers", {
            method: "POST",
            body: data,
        }),

    update: (id: number, data: Partial<Supplier>) =>
        apiRequest<Supplier>(`/suppliers/${id}`, {
            method: "PUT",
            body: data,
        }),

    delete: (id: number) =>
        apiRequest<void>(`/suppliers/${id}`, {
            method: "DELETE",
        }),

    searchByName: (name: string) =>
        apiRequest<Supplier[]>(
            `/suppliers/search?name=${encodeURIComponent(name)}`
        ),

    searchByPhone: (phone: string) =>
        apiRequest<Supplier[]>(
            `/suppliers/search?phone=${encodeURIComponent(phone)}`
        ),
}

export const stockAdjustmentApi = {

    getAll: async () => {
        const result = await apiRequest<any>("/stock-adjustments")

        if (result && typeof result === 'object') {
            if (result.content && Array.isArray(result.content)) {
                return result.content as StockAdjustment[]
            }

            if (Array.isArray(result)) {
                return result as StockAdjustment[]
            }
        }

        return result as StockAdjustment[]
    },

    getById: (id: number) =>
        apiRequest<StockAdjustment>(`/stock-adjustments/${id}`),

    getByProductId: (productId: number) =>
        apiRequest<StockAdjustment[]>(
            `/stock-adjustments/product/${productId}`
        ),

    getRecent: (limit = 5) =>
        apiRequest<PageResponse<StockAdjustment>>(
            `/stock-adjustments/recent?limit=${limit}`
        ),

    create: (data: Partial<StockAdjustment>) =>
        apiRequest<StockAdjustment>("/stock-adjustments", {
            method: "POST",
            body: data,
        }),

    update: (id: number, data: Partial<StockAdjustment>) =>
        apiRequest<StockAdjustment>(`/stock-adjustments/${id}`, {
            method: "PUT",
            body: data,
        }),
}

export const transactionApi = {

    getAll: () =>
        apiRequest<Transaction[]>("/transactions"),

    getById: (id: number) =>
        apiRequest<Transaction>(`/transactions/${id}`),

    getByProductId: (productId: number) =>
        apiRequest<Transaction[]>(
            `/transactions/product/${productId}`
        ),

    getByType: (type: string) =>
        apiRequest<Transaction[]>(
            `/transactions/type/${type}`
        ),

    getByDateRange: (start: string, end: string) => {
        assertValidDateRange(start, end)

        return apiRequest<Transaction[]>(
            `/transactions/date-range?start=${start}&end=${end}`
        )
    },

    getRecent: (limit = 5) =>
        apiRequest<PageResponse<Transaction>>(
            `/transactions/recent?limit=${limit}`
        ),

    create: (data: Partial<Transaction>) =>
        apiRequest<Transaction>("/transactions", {
            method: "POST",
            body: data,
        }),
}

export const profileApi = {

    get: () =>
        apiRequest<User>("/profile"),

    update: async (data: Partial<User>) => {
        try {
            return await apiRequest<User>("/profile", {
                method: "PUT",
                body: data,
            })
        } catch (err) {
            // Fallback: update via users endpoint using the user's own ID
            const profile = await apiRequest<User>("/profile")
            if (profile?.id) {
                return await apiRequest<User>(`/users/${profile.id}`, {
                    method: "PUT",
                    body: data,
                })
            }
            throw err
        }
    },

    uploadPicture: async (file: File): Promise<User> => {
        const token = localStorage.getItem("token")
        const formData = new FormData()
        // Try common field names backends use for file uploads
        formData.append("file", file)
        formData.append("image", file)
        formData.append("picture", file)
        const response = await fetch(`${API_BASE_URL}/profile/picture`, {
            method: "POST",
            headers: token && token !== "null" && token !== "undefined"
                ? { Authorization: `Bearer ${token}` }
                : {},
            body: formData,
        })
        if (!response.ok) {
            const text = await response.text()
            let message = `Request failed with status ${response.status}`
            if (text) {
                try { message = JSON.parse(text).message || text } catch { message = text }
            }
            throw new Error(message)
        }
        const text = await response.text()
        return text ? JSON.parse(text) : {} as User
    },

    changePassword: (data: {
        currentPassword: string
        newPassword: string
    }) => {        // send all common field name variants so the backend accepts whichever it expects
        const body = {
            currentPassword: data.currentPassword,
            oldPassword: data.currentPassword,
            newPassword: data.newPassword,
            password: data.newPassword,
        }
        return apiRequest<{ message: string }>("/profile/password", {
            method: "PUT",
            body,
        })
    },
}

export const auditLogApi = {

    getAll: (page = 0, size = 10) =>
        apiRequest<PaginatedResponse<AuditLog>>(
            `/audit-logs?page=${page}&size=${size}`
        ),

    getByUserId: (userId: number, page = 0, size = 10) =>
        apiRequest<PaginatedResponse<AuditLog>>(
            `/audit-logs/user/${userId}?page=${page}&size=${size}`
        ),

    getByAction: (action: string, page = 0, size = 10) =>
        apiRequest<PaginatedResponse<AuditLog>>(
            `/audit-logs/action/${action}?page=${page}&size=${size}`
        ),
}

export const backupApi = {

    create: () =>
        apiRequest<{ message: string }>("/backup", {
            method: "POST",
        }),

    list: async () => {
        const data = await apiRequest<any[]>("/backup")
        // log raw response so we can identify exact field names from BackupInfoDTO
        if (Array.isArray(data) && data.length > 0) {
            console.table(data)
            console.log('[BackupInfo fields]', Object.keys(data[0]))
        }
        return data as BackupInfo[]
    },

    download: async (filename: string) => {
        const token = localStorage.getItem("token")
        const response = await fetch(`${API_BASE_URL}/backup/download/${encodeURIComponent(filename)}`, {
            method: "GET",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        })
        if (!response.ok) {
            const text = await response.text()
            throw new Error(text || `Download failed with status ${response.status}`)
        }
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    },

    restore: (filename: string) =>
        apiRequest<{ message: string }>(
            `/backup/restore/${filename}`,
            { method: "POST" }
        ),

    delete: (filename: string) =>
        apiRequest<{ message: string }>(`/backup/${filename}`, {
            method: "DELETE",
        }),
}

export const healthApi = {
    check: () =>
        apiRequest<{ status: string; components?: Record<string, { status: string; details?: Record<string, any> }> }>("/health"),
}

export const notificationApi = {
    getAll: () => {
        return Promise.resolve([
            {
                id: 1,
                userId: 1,
                type: "INFO" as const,
                title: "Welcome to StockTrack",
                message: "Your inventory management system is ready to use",
                isRead: false,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                userId: 1,
                type: "WARNING" as const,
                title: "System Notice",
                message: "This is a demo notification system. Backend notifications are not implemented.",
                isRead: false,
                createdAt: new Date(Date.now() - 3600000).toISOString()
            }
        ])
    },

    getUnread: () => {
        return Promise.resolve([])
    },

    markAsRead: (_id: number) => {
        return Promise.resolve()
    },

    markAllAsRead: () => {
        return Promise.resolve()
    },

    delete: (_id: number) => {
        return Promise.resolve()
    },
}



export const userApi = {
    getAll: async () => {
        const users = await apiRequest<User[]>("/users")
        return users.map(user => ({
            ...user,
            role: (user && user.roles && user.roles.length > 0) ? user.roles[0] : user?.role || 'USER'
        }))
    },

    getById: async (id: number): Promise<User> => {
        const user = await apiRequest<User>(`/users/${id}`)
        return {
            ...user,
            role: (user && user.roles && user.roles.length > 0) ? user.roles[0] : user?.role || 'USER'
        }
    },

    create: (data: Partial<User> & { password?: string; roles?: string[]; isActive?: boolean }) => {
        const payload: any = {}

        if (data.username && data.username.trim()) payload.username = data.username.trim()
        if (data.email && data.email.trim()) payload.email = data.email.trim()

        if (data.roles && data.roles.length > 0) {
            payload.roles = convertRolesToBackendFormat(data.roles)
        } else if (data.role) {
            payload.roles = [convertRoleToBackendFormat(data.role)]
        } else {
            payload.roles = ['USER']
        }

        if (data.password && data.password.trim()) payload.password = data.password.trim()
        if (data.isActive !== undefined) payload.isActive = data.isActive

        return apiRequest<User>("/users", {
            method: "POST",
            body: payload,
        })
    },

    update: (id: number, data: Partial<User> & { password?: string; roles?: string[]; isActive?: boolean }) => {
        const payload: any = {}

        if (data.username && data.username.trim()) payload.username = data.username.trim()
        if (data.email && data.email.trim()) payload.email = data.email.trim()

        if (data.roles && data.roles.length > 0) {
            payload.roles = convertRolesToBackendFormat(data.roles)
        } else if (data.role) {
            payload.roles = [convertRoleToBackendFormat(data.role)]
        }

        console.log('Sending update payload:', JSON.stringify(payload, null, 2))

        return apiRequest<User>(`/users/${id}`, {
            method: "PUT",
            body: payload,
        })
    },

    softDelete: (id: number, userData: Partial<User> & { password?: string }) => {
        const payload: any = { isActive: false }

        if (userData.username) payload.username = userData.username
        if (userData.email) payload.email = userData.email
        if (userData.roles && userData.roles.length > 0) {
            payload.roles = convertRolesToBackendFormat(userData.roles)
        } else if (userData.role) {
            payload.roles = [convertRoleToBackendFormat(userData.role)]
        }

        return apiRequest<User>(`/users/${id}`, {
            method: "PUT",
            body: payload,
        })
    },

    restore: (id: number, userData: Partial<User> & { password?: string }) => {
        const payload: any = { isActive: true }

        if (userData.username) payload.username = userData.username
        if (userData.email) payload.email = userData.email
        if (userData.roles && userData.roles.length > 0) {
            payload.roles = convertRolesToBackendFormat(userData.roles)
        } else if (userData.role) {
            payload.roles = [convertRoleToBackendFormat(userData.role)]
        }

        return apiRequest<User>(`/users/${id}`, {
            method: "PUT",
            body: payload,
        })
    },

    toggleStatus: (id: number, isActive: boolean, userData: Partial<User> & { password?: string }) => {
        const payload: any = { isActive }

        if (userData.username) payload.username = userData.username
        if (userData.email) payload.email = userData.email
        if (userData.roles && userData.roles.length > 0) {
            payload.roles = convertRolesToBackendFormat(userData.roles)
        } else if (userData.role) {
            payload.roles = [convertRoleToBackendFormat(userData.role)]
        }

        return apiRequest<User>(`/users/${id}`, {
            method: "PUT",
            body: payload,
        })
    },

    hardDelete: (id: number) => apiRequest<void>(`/users/${id}`, { method: "DELETE" }),

    resetPassword: (id: number, newPassword: string) => {
        const payload = {
            password: newPassword.trim()
        }

        return apiRequest<User>(`/users/${id}`, {
            method: "PUT",
            body: payload,
        })
    },
}

export interface User {
    id: number
    username: string
    email: string
    firstName?: string
    lastName?: string
    fullName?: string
    role?: string
    roles?: string[]
    isActive?: boolean
    profileImage?: string
    profilePicture?: string
    createdAt: string
    updatedAt?: string
    lastLogin?: string | null
}

export type Product = {
    id: number
    name: string
    description: string
    sku: string
    barcode?: string
    category?: string
    price: number
    currentStock: number
    reorderThreshold: number
    unitOfMeasure: string
    stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "OVER_STOCK"
    supplierId: number
    isActive: boolean
    image?: string
    expiryDate?: string
}

export interface Supplier {
    id: number
    name: string
    email: string
    phone: string
    address: string
    url?: string
    website?: string
    active: boolean
    createdAt: string
}

export interface StockAdjustment {
    id: number
    productId?: number
    productName?: string
    adjustmentType: "INCREMENT" | "DECREMENT"
    adjustmentQuantity: any
    previousStock: any
    newStock: any
    reason: string
    adjustedBy?: string
    adjustedAt?: string
    createdAt?: string
    notes?: any
    financialValue?: number
    unitPrice?: number
}

export interface Transaction {
    id: number
    productId: number
    productName?: string
    type: "PURCHASE" | "SALE" | "RETURN" | "ADJUSTMENT" | "TRANSFER" | "DAMAGED" | "EXPIRED"
    quantity: number
    unitPrice: number
    totalPrice: number
    referenceNumber?: string
    description?: string
    notes?: string
    createdAt: string
    createdBy?: string
}

export interface AuditLog {
    id: number
    userId: number
    username: string
    action: string
    details: string
    ipAddress: string
    createdAt: string
}

export interface PaginatedResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    size: number
    number: number
}

export interface PageResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    number: number
    size?: number
}

export interface Notification {
    id: number
    userId: number
    type: "INFO" | "WARNING" | "ERROR" | "SUCCESS"
    title: string
    message: string
    isRead: boolean
    createdAt: string
    updatedAt?: string
    metadata?: Record<string, any>
}

export interface BackupInfo {
    filename?: string
    fileName?: string
    name?: string
    size?: number
    fileSize?: number
    sizeInBytes?: number
    sizeFormatted?: string
    createdAt?: string
    createdDate?: string
    lastModified?: string
    [key: string]: any
}

export interface OverstockItem {
    id: number
    productName: string
    sku: string
    currentStock: number
    reorderThreshold?: number
    minLevel?: number
    avgDailySales?: number
    daysOfSupply?: number
    status?: string
    [key: string]: any
}

export interface InventoryClassifiedItem {
    id: number
    productName: string
    sku: string
    currentStock: number
    reorderThreshold?: number
    minLevel?: number
    avgDailySales?: number
    daysOfSupply?: number
    status: string
    [key: string]: any
}

export const analyticsApi = {
    getProductCategories: async () => {
        const result = await apiRequest<any>("/dashboard/product-categories")

        // normalize just in case backend wraps it
        if (Array.isArray(result)) return result
        if (Array.isArray(result?.data)) return result.data
        if (Array.isArray(result?.content)) return result.content

        return []
    }
}

export interface PurchaseOrderItem {
    id?: number
    productId: number
    productName?: string
    quantity: number
    unitPrice: number
    totalPrice?: number
}

export interface PurchaseOrder {
    id: number
    poNumber?: string
    supplierId: number
    supplierName?: string
    status: "PENDING" | "APPROVED" | "RECEIVED" | "CANCELLED" | string
    totalAmount?: number
    orderDate?: string
    expectedDeliveryDate?: string
    notes?: string
    createdAt?: string
    createdBy?: string
    items?: PurchaseOrderItem[]
}

export const purchaseOrderApi = {
    getAll: () =>
        apiRequest<PurchaseOrder[]>("/purchase-orders"),

    getById: (id: number) =>
        apiRequest<PurchaseOrder>(`/purchase-orders/${id}`),

    create: (data: {
        supplierId: number
        poNumber?: string
        status?: string
        items: { productId: number; quantity: number; unitPrice: number }[]
        notes?: string
        expectedDeliveryDate?: string
    }) =>
        apiRequest<PurchaseOrder>("/purchase-orders", {
            method: "POST",
            body: data,
        }),

    receive: (id: number) =>
        apiRequest<PurchaseOrder>(`/purchase-orders/${id}/receive`, {
            method: "POST",
        }),

    cancel: (id: number) =>
        apiRequest<PurchaseOrder>(`/purchase-orders/${id}/cancel`, {
            method: "POST",
        }),
}

export const dashboardApi = {
    getOverstockItems: async () => {
        const result = await apiRequest<any>("/dashboard/overstock-items")
        const items = normalizeListResponse<OverstockItem>(result)
        return items.map(item => normalizeInventoryClassifiedItem(item) as unknown as OverstockItem)
    },
    getInStockItems: async () => {
        const result = await apiRequest<any>("/dashboard/in-stock-items")
        const items = normalizeListResponse<InventoryClassifiedItem>(result)
        return items.map(item => normalizeInventoryClassifiedItem(item))
    },
    getLowStockItems: async () => {
        const result = await apiRequest<any>("/dashboard/low-stock-items")
        const items = normalizeListResponse<InventoryClassifiedItem>(result)
        return items.map(item => normalizeInventoryClassifiedItem(item))
    },
}
