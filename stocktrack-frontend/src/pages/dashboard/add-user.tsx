import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { userApi } from "@/lib/api"
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
import { Shield, ArrowLeft } from "lucide-react"

export default function AddUserPage() {
    const { user: currentUser } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()
    const [selectedRoles, setSelectedRoles] = useState<string[]>([])
    const [isActive, setIsActive] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

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
            default:
                return cleanRole.split('_').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ')
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
                    const fieldErrors = Object.entries(errorObj.fieldErrors)
                        .map(([field, message]) => {
                            if (field === 'password' && message === 'must not be blank') {
                                return "Password is required"
                            }
                            if (field === 'username' && message === 'must not be blank') {
                                return "Username is required"
                            }
                            if (field === 'email' && message === 'must not be blank') {
                                return "Email is required"
                            }
                            return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${message}`
                        })
                        .join(', ')
                    return fieldErrors
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

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        
        try {
            const username = formData.get("username") as string
            const email = formData.get("email") as string
            const password = formData.get("password") as string
            
            if (!username || username.trim() === "") {
                toast({
                    title: "Validation Error",
                    description: "Username is required",
                    variant: "destructive",
                })
                return
            }
            
            if (!email || email.trim() === "") {
                toast({
                    title: "Validation Error",
                    description: "Email is required", 
                    variant: "destructive",
                })
                return
            }
            
            if (!password || password.trim() === "") {
                toast({
                    title: "Validation Error",
                    description: "Password is required",
                    variant: "destructive",
                })
                return
            }
            
            if (selectedRoles.length === 0) {
                toast({
                    title: "Validation Error",
                    description: "Please select at least one role",
                    variant: "destructive",
                })
                return
            }

            const userData = {
                username: username.trim(),
                email: email.trim(),
                roles: selectedRoles,
                password: password.trim(),
                isActive: isActive
            }

            await userApi.create(userData)
            toast({
                title: "Success",
                description: "User created successfully",
            })
            navigate("/dashboard/users")
        } catch (error) {
            const errorMessage = parseErrorMessage(error)
            toast({
                title: "Failed to Create User",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

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
                title="Add New User" 
                description="Create a new user account with roles and permissions"
            />

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>User Information</CardTitle>
                    <CardDescription>
                        Fill in the details for the new user account
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
                                        disabled={isSubmitting}
                                        placeholder="Enter username"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email *</Label>
                                    <Input 
                                        id="email" 
                                        name="email" 
                                        type="email" 
                                        required 
                                        disabled={isSubmitting}
                                        placeholder="Enter email address"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="password">Password *</Label>
                                <Input 
                                    id="password" 
                                    name="password" 
                                    type="password" 
                                    required 
                                    disabled={isSubmitting}
                                    placeholder="Enter password"
                                />
                            </div>

                            <div>
                                <Label>Roles *</Label>
                                <div className="space-y-2 mt-2">
                                    {availableRoles.map((role) => (
                                        <div key={role.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`role-${role.value}`}
                                                checked={selectedRoles.includes(role.value)}
                                                onCheckedChange={() => toggleRole(role.value)}
                                                disabled={isSubmitting}
                                            />
                                            <Label htmlFor={`role-${role.value}`} className="text-sm font-normal">
                                                {role.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {selectedRoles.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {selectedRoles.map((role) => (
                                            <Badge key={role} variant={getRoleVariant(role)}>
                                                {getRoleDisplayName(role)}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isActive"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    disabled={isSubmitting}
                                />
                                <Label htmlFor="isActive" className="text-sm font-medium">
                                    Active User
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    {isActive ? "User will be able to log in" : "User will be deactivated"}
                                </span>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => navigate("/dashboard/users")}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Creating..." : "Create User"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    )
}