$content = Get-Content "src\lib\api.ts" -Raw
$start = $content.IndexOf("export const userApi = {")
$end = $content.IndexOf("`nexport interface User {")
$oldBlock = $content.Substring($start, $end - $start)

$newBlock = @'
export const userApi = {
    getAll: async (): Promise<User[]> => {
        const users = await apiRequest<User[]>("/users")
        return users.map(user => ({
            ...user,
            role: Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : user.role || undefined,
        }))
    },

    getById: async (id: number): Promise<User> => {
        const user = await apiRequest<User>(`/users/${id}`)
        return {
            ...user,
            role: Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : user.role || undefined,
        }
    },

    create: (data: { username: string; email: string; password: string; roles: string[]; isActive?: boolean }) => {
        const payload: Record<string, any> = {
            username: data.username.trim(),
            email: data.email.trim(),
            password: data.password.trim(),
            roles: convertRolesToBackendFormat(data.roles),
            isActive: data.isActive ?? true,
        }
        return apiRequest<User>("/users", { method: "POST", body: payload })
    },

    update: (id: number, data: { username: string; email: string; roles: string[]; isActive: boolean; profileImage?: string }) => {
        const payload: Record<string, any> = {
            username: data.username.trim(),
            email: data.email.trim(),
            roles: convertRolesToBackendFormat(data.roles),
            isActive: data.isActive,
        }
        console.log("[userApi.update] sending payload:", JSON.stringify(payload))
        return apiRequest<User>(`/users/${id}`, { method: "PUT", body: payload })
    },

    resetPassword: (id: number, newPassword: string) =>
        apiRequest<User>(`/users/${id}`, { method: "PUT", body: { password: newPassword.trim() } }),

    softDelete: (id: number, userData: { username: string; email: string; roles: string[] }) => {
        const payload: Record<string, any> = {
            username: userData.username,
            email: userData.email,
            roles: convertRolesToBackendFormat(userData.roles),
            isActive: false,
        }
        return apiRequest<User>(`/users/${id}`, { method: "PUT", body: payload })
    },

    restore: (id: number, userData: { username: string; email: string; roles: string[] }) => {
        const payload: Record<string, any> = {
            username: userData.username,
            email: userData.email,
            roles: convertRolesToBackendFormat(userData.roles),
            isActive: true,
        }
        return apiRequest<User>(`/users/${id}`, { method: "PUT", body: payload })
    },

    toggleStatus: (id: number, isActive: boolean, userData: { username: string; email: string; roles: string[] }) => {
        const payload: Record<string, any> = {
            username: userData.username,
            email: userData.email,
            roles: convertRolesToBackendFormat(userData.roles),
            isActive,
        }
        return apiRequest<User>(`/users/${id}`, { method: "PUT", body: payload })
    },

    hardDelete: (id: number) => apiRequest<void>(`/users/${id}`, { method: "DELETE" }),
}

'@

$newContent = $content.Replace($oldBlock, $newBlock)
Set-Content "src\lib\api.ts" -Value $newContent -NoNewline
Write-Host "Patched successfully"
