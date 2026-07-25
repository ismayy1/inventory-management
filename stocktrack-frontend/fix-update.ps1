$content = Get-Content "src\lib\api.ts" -Raw

# The backend SignupRequest likely only has: username, email, password, roles
# Remove isActive from the update payload
$old = @'
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
'@

$new = @'
    update: (id: number, data: { username: string; email: string; roles: string[]; isActive?: boolean; profileImage?: string }) => {
        // Backend expects SignupRequest: { username, email, password?, roles }
        const payload: Record<string, any> = {
            username: data.username.trim(),
            email: data.email.trim(),
            roles: convertRolesToBackendFormat(data.roles),
        }
        console.log("[userApi.update] sending payload:", JSON.stringify(payload))
        return apiRequest<User>(`/users/${id}`, { method: "PUT", body: payload })
    },
'@

$content = $content.Replace($old, $new)
Set-Content "src\lib\api.ts" -Value $content -NoNewline
Write-Host "Fixed userApi.update to match backend SignupRequest structure"
