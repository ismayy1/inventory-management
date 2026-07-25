import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { userApi, type User } from "@/lib/api"
import { isUserAdmin } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/dashboard/header"
import { Shield, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react"

export default function EditUserPage() {
    const { id } = useParams<{ id: string }>()
    const { user: currentUser } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()

    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [selectedRoles, setSelectedRoles] = useState<string[]>([])
    const [isActive, setIsActive] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [profileImage, setProfileImage] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isResettingPassword, setIsResettingPassword] = useState(false)

    const availableRoles = [
        { value: "SYSTEM_ADMIN", label: "General Manager" },
        { value: "INVENTORY_MANAGER", label: "Inventory Manager" },
    ]

    const getRoleVariant = (role: string) => {
        const normalizedRole = role?.toUpperCase() || ""
        if (normalizedRole.includes("SYSTEM_ADMIN")) return "destructive"
        if (normalizedRole.includes("MANAGER")) return "default"
        return "outline"
    }

    const getRoleDisplayName = (role: string) => {
        if (!role) return "Unknown"
        const cleanRole = role.replace(/^ROLE_/, "")
        switch (cleanRole.toUpperCase()) {
            case "SYSTEM_ADMIN": return "General Manager"
            case "INVENTORY_MANAGER": return "Inventory Manager"
            default: return cleanRole.split('_').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
        }
    }
    const toggleRole = (role: string) => {
        if (selectedRoles.includes(role)) {
            setSelectedRoles(selectedRoles.filter(r => r !== role))
        } else {
            setSelectedRoles([...selectedRoles, role])
        }
    }

    const parseErrorMessage = (error: any): string => {
        if (!error) return "Unknown error occurred"
        
        let errorMessage = error.message || error.toString()
        
        try {
            if (errorMessage.includes('{') && errorMessage.includes('}')) {
                const jsonStart = errorMessage.indexOf('{')
                const jsonEnd = errorMessage.lastIndexOf('}') + 1
                const jsonStr = errorMessage.substring(jsonStart, jsonEnd)
                const errorObj = JSON.parse(jsonStr)
                
                if (errorObj.fieldErrors) {
                    const allFieldErrors = Object.entries(errorObj.fieldErrors)
                    
                    const relevantErrors = allFieldErrors
                        .filter(([field]) => field !== 'password')
                        .map(([field, message]) => {
                            if (field === 'username' && message === 'must not be blank') {
                                return "Username is required"
                            }
                            if (field === 'email' && message === 'must not be blank') {
                                return "Email is required"
                            }
                            if (field === 'username' && typeof message === 'string' && message.includes('already exists')) {
                                return "Username already exists"
                            }
                            if (field === 'email' && typeof message === 'string' && message.includes('already exists')) {
                                return "Email already exists"
                            }
                            return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${message}`
                        })
                    
                    if (relevantErrors.length > 0) {
                        return relevantErrors.join(', ')
                    }
                    
                    if (allFieldErrors.length > 0 && allFieldErrors.every(([field]) => field === 'password')) {
                        return "User updated successfully (password field ignored)"
                    }
                }
                
                if (errorObj.message) {
                    return errorObj.message
                }
            }
        } catch (parseError) {
            if (errorMessage.includes('409')) {
                return "Username or email already exists"
            }
            if (errorMessage.includes('400')) {
                return "Invalid input provided"
            }
            if (errorMessage.includes('404')) {
                return "User not found"
            }
            if (errorMessage.includes('403')) {
                return "Access denied"
            }
        }
        
        if (errorMessage.length > 100) {
            return "An error occurred. Please check your input and try again."
        }
        
        return errorMessage
    }
    if (!isUserAdmin(currentUser)) {
        return (
            <div className="flex h-full items-center justify-center">
                <Card className="w-96">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Access Denied
                        </CardTitle>
                        <CardDescription>
                            You need administrator privileges to access this page.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    useEffect(() => {
        const loadUser = async () => {
            if (!id) {
                navigate("/dashboard/users")
                return
            }

            try {
                const user = await userApi.getById(parseInt(id))
                setSelectedUser(user)

                const userRoles = user.roles && user.roles.length > 0
                    ? user.roles.map(role =>
                        role.startsWith("ROLE_") ? role.replace(/^ROLE_/, "") : role
                    )
                    : []

                setSelectedRoles(userRoles)
                setIsActive(user.isActive !== false)
                setProfileImage(user.profileImage || "")
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load user data",
                    variant: "destructive"
                })
                navigate("/dashboard/users")
            } finally {
                setIsLoading(false)
            }
        }

        loadUser()
    }, [id, navigate, toast])
    const handlePasswordReset = async () => {
        if (!selectedUser) return

        if (!newPassword.trim()) {
            toast({ title: "Validation Error", description: "New password is required", variant: "destructive" })
            return
        }

        if (newPassword.length < 6) {
            toast({ title: "Validation Error", description: "Password must be at least 6 characters", variant: "destructive" })
            return
        }

        if (newPassword !== confirmPassword) {
            toast({ title: "Validation Error", description: "Passwords do not match", variant: "destructive" })
            return
        }

        setIsResettingPassword(true)
        try {
            await userApi.resetPassword(selectedUser.id, newPassword)
            setNewPassword("")
            setConfirmPassword("")
            toast({ title: "Success", description: "Password reset successfully" })
        } catch (error) {
            const msg = parseErrorMessage(error)
            toast({ title: "Failed to Reset Password", description: msg, variant: "destructive" })
        } finally {
            setIsResettingPassword(false)
        }
    }

    const handleSubmit = async (formData: FormData) => {
        if (!selectedUser) return

        setIsSubmitting(true)

        try {
            const username = (formData.get("username") as string)?.trim()
            const email = (formData.get("email") as string)?.trim()

            if (!username) {
                toast({
                    title: "Validation Error",
                    description: "Username is required",
                    variant: "destructive"
                })
                return
            }

            if (!email) {
                toast({
                    title: "Validation Error",
                    description: "Email is required",
                    variant: "destructive"
                })
                return
            }

            if (selectedRoles.length === 0) {
                toast({
                    title: "Validation Error",
                    description: "Please select at least one role",
                    variant: "destructive"
                })
                return
            }

            const userData: any = {
                username: username.trim(),
                email: email.trim(),
                roles: selectedRoles.length > 0 ? selectedRoles : [],
                isActive: isActive,
                profileImage: profileImage.trim() || undefined,
            }

            if (!userData.roles || userData.roles.length === 0) {
                toast({
                    title: "Validation Error",
                    description: "At least one role must be selected",
                    variant: "destructive"
                })
                return
            }

            const validRoles = ["SYSTEM_ADMIN", "INVENTORY_MANAGER"]
            const invalidRoles = userData.roles.filter((role: string) => !validRoles.includes(role))
            if (invalidRoles.length > 0) {
                toast({
                    title: "Validation Error",
                    description: `Invalid roles: ${invalidRoles.join(', ')}`,
                    variant: "destructive"
                })
                return
            }

            const isCurrentUser = selectedUser.id === currentUser?.id
            if (isCurrentUser && !isActive) {
                toast({
                    title: "Validation Error",
                    description: "You cannot deactivate your own account",
                    variant: "destructive"
                })
                return
            }
            
            if (!selectedUser.id || selectedUser.id <= 0) {
                toast({
                    title: "Validation Error",
                    description: "Invalid user ID",
                    variant: "destructive",
                })
                return
            }

            const userId = parseInt(selectedUser.id.toString())
            if (isNaN(userId)) {
                toast({
                    title: "Validation Error",
                    description: "User ID must be a valid number",
                    variant: "destructive",
                })
                return
            }
            
            await userApi.update(userId, userData)

            toast({
                title: "Success",
                description: "User updated successfully"
            })

            navigate("/dashboard/users")

        } catch (error) {
            const errorMessage = parseErrorMessage(error)
            
            if (errorMessage.includes("User updated successfully")) {
                toast({
                    title: "Success",
                    description: "User updated successfully"
                })
                navigate("/dashboard/users")
            } else {
                toast({
                    title: "Failed to Update User",
                    description: errorMessage,
                    variant: "destructive",
                })
            }
        } finally {
            setIsSubmitting(false)
        }
    }
    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading user data...</span>
                </div>
            </div>
        )
    }

    if (!selectedUser) {
        return (
            <div className="flex h-full items-center justify-center">
                <Card className="w-96">
                    <CardHeader>
                        <CardTitle>User Not Found</CardTitle>
                        <CardDescription>
                            The requested user could not be found.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const isCurrentUser = selectedUser.id === currentUser?.id

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/dashboard/users")}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Users
                </Button>
            </div>

            <Header
                title={`Edit User: ${selectedUser.username}`}
                description="Update user account information, roles, and permissions"
            />

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>User Information</CardTitle>
                    <CardDescription>
                        Update the details for this user account
                        {isCurrentUser && (
                            <span className="block text-amber-600 mt-1">
                                ⚠️ You are editing your own account
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>
                <div className="p-6">
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        handleSubmit(new FormData(e.currentTarget))
                    }}>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="username">Username *</Label>
                                    <Input
                                        id="username"
                                        name="username"
                                        required
                                        defaultValue={selectedUser.username}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        defaultValue={selectedUser.email}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="profileImage">Profile Image URL</Label>
                                <div className="flex items-center gap-3 mt-1">
                                    {profileImage && (
                                        <img
                                            src={profileImage}
                                            alt="Profile preview"
                                            className="h-10 w-10 rounded-full object-cover border"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                                        />
                                    )}
                                    <Input
                                        id="profileImage"
                                        name="profileImage"
                                        type="url"
                                        placeholder="https://example.com/avatar.jpg"
                                        value={profileImage}
                                        onChange={(e) => setProfileImage(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Roles *</Label>
                                <div className="space-y-2 mt-2">
                                    {availableRoles.map(role => (
                                        <div key={role.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={role.value}
                                                checked={selectedRoles.includes(role.value)}
                                                onCheckedChange={() => toggleRole(role.value)}
                                            />
                                            <Label htmlFor={role.value}>{role.label}</Label>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-1 mt-2">
                                    {selectedRoles.map(role => (
                                        <Badge key={role} variant={getRoleVariant(role)}>
                                            {getRoleDisplayName(role)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {!isCurrentUser && (
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={isActive}
                                        onCheckedChange={setIsActive}
                                    />
                                    <Label>Active User</Label>
                                </div>
                            )}

                            <div className="border-t pt-4 space-y-4">
                                <div>
                                    <p className="text-sm font-medium">Reset Password</p>
                                    <p className="text-sm text-muted-foreground">Leave blank to keep the current password.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <div className="relative mt-1">
                                            <Input
                                                id="newPassword"
                                                type={showNewPassword ? "text" : "password"}
                                                placeholder="Enter new password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                tabIndex={-1}
                                            >
                                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <div className="relative mt-1">
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                tabIndex={-1}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-sm text-destructive">Passwords do not match</p>
                                )}
                                <div className="flex justify-start">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handlePasswordReset}
                                        disabled={isResettingPassword || !newPassword || !confirmPassword}
                                    >
                                        {isResettingPassword ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting...</>
                                        ) : (
                                            "Reset Password"
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/dashboard/users")}
                                >
                                    Cancel
                                </Button>

                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Updating..." : "Update User"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    )
}