import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { userApi, type User } from "@/lib/api"
import { isUserAdmin } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { DataTable, type Column } from "@/components/dashboard/data-table"
import { Header } from "@/components/dashboard/header"
import { useNavigate } from "react-router-dom"
import { 
    UserPlus, 
    Edit, 
    Trash2, 
    RotateCcw, 
    Eye,
    Shield,
    Key,
    Search
} from "lucide-react"

export default function UsersPage() {
    const { user: currentUser } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()
    const [users, setUsers] = useState<User[]>([])
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [isPasswordResetDialogOpen, setIsPasswordResetDialogOpen] = useState(false)
    
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState<string>("ALL")
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(20)

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

    const getAllRolesDisplay = (user: User) => {
        if (user && user.roles && user.roles.length > 0) {
            return user.roles.map(role => getRoleDisplayName(role)).join(', ')
        }
        return getRoleDisplayName(user?.role || 'USER')
    }

    const filteredUsers = useMemo(() => {
        let filtered = users

        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase()
            filtered = filtered.filter(user => {
                const username = user.username?.toLowerCase() || ""
                const email = user.email?.toLowerCase() || ""
                const fullName = user.fullName?.toLowerCase() || ""
                const allRoles = getAllRolesDisplay(user).toLowerCase()
                
                return (
                    username.includes(searchLower) ||
                    email.includes(searchLower) ||
                    fullName.includes(searchLower) ||
                    allRoles.includes(searchLower) ||
                    user.id.toString().includes(searchLower)
                )
            })
        }

        if (roleFilter !== "ALL") {
            filtered = filtered.filter(user => {
                if (user.roles && user.roles.length > 0) {
                    return user.roles.some(role => role.toUpperCase() === roleFilter.toUpperCase())
                }
                return user.role?.toUpperCase() === roleFilter.toUpperCase()
            })
        }

        if (statusFilter !== "ALL") {
            filtered = filtered.filter(user => {
                const isActive = user.isActive !== false
                return statusFilter === "ACTIVE" ? isActive : !isActive
            })
        }

        return filtered
    }, [users, searchTerm, roleFilter, statusFilter])

    const paginatedUsers = useMemo(() => {
        const startIndex = currentPage * pageSize
        return filteredUsers.slice(startIndex, startIndex + pageSize)
    }, [filteredUsers, currentPage, pageSize])

    const totalPages = Math.ceil(filteredUsers.length / pageSize)

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
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            const data = await userApi.getAll()
            
            if (Array.isArray(data) && data.length > 0) {
                const usersWithRoles = data.map(user => ({
                    ...user,
                    role: user.role !== undefined && user.role !== null && user.role !== '' ? user.role : 'user'
                }))
                
                setUsers(usersWithRoles)
                return
            }
            
            throw new Error("No valid user data received from API")
            
        } catch (error) {
            const mockUsers = [
                {
                    id: 1,
                    username: "admin",
                    email: "admin@example.com",
                    role: "admin",
                    isActive: true,
                    createdAt: new Date().toISOString(),
                },
                {
                    id: 2,
                    username: "system_admin",
                    email: "sysadmin@example.com", 
                    role: "SYSTEM_ADMIN",
                    isActive: true,
                    createdAt: new Date().toISOString(),
                },
                {
                    id: 3,
                    username: "inventory_mgr",
                    email: "inventory@example.com", 
                    role: "INVENTORY_MANAGER",
                    isActive: true,
                    createdAt: new Date().toISOString(),
                },
                {
                    id: 4,
                    username: "procurement_user",
                    email: "procurement@example.com", 
                    role: "PROCUREMENT",
                    isActive: true,
                    createdAt: new Date().toISOString(),
                },
                {
                    id: 5,
                    username: "warehouse_staff",
                    email: "warehouse@example.com", 
                    role: "WAREHOUSE_STAFF",
                    isActive: false,
                    createdAt: new Date().toISOString(),
                },
                {
                    id: 6,
                    username: "analyst",
                    email: "analyst@example.com", 
                    role: "INVENTORY_ANALYST",
                    isActive: true,
                    createdAt: new Date().toISOString(),
                },
                {
                    id: 7,
                    username: "regular_user",
                    email: "user@example.com", 
                    role: "user",
                    isActive: true,
                    createdAt: new Date().toISOString(),
                },
            ]

            if (currentUser && !mockUsers.find(u => u.username === currentUser.username)) {
                mockUsers.unshift({
                    id: 0,
                    username: currentUser.username,
                    email: currentUser.email,
                    role: currentUser.role || 'admin',
                    isActive: currentUser.isActive !== false,
                    createdAt: currentUser.createdAt,
                })
            }
            
            setUsers(mockUsers)
            
            toast({
                title: "Info",
                description: "Using demo data - backend user management may not be available",
                variant: "default",
            })
        }
    }

    const handleSoftDelete = async (user: User) => {
        try {
            const updatedUser = {
                username: user.username,
                email: user.email,
                roles: user.roles || (user.role ? [user.role] : ['USER']),
                isActive: false
            }
            await userApi.softDelete(user.id, updatedUser)
            toast({
                title: "Success",
                description: "User deactivated successfully",
            })
            loadUsers()
        } catch (error) {
            toast({
                title: "Failed to Deactivate User",
                description: "An error occurred while deactivating the user",
                variant: "destructive",
            })
        }
    }

    const handleHardDelete = async (user: User) => {
        try {
            await userApi.hardDelete(user.id)
            toast({
                title: "Success",
                description: "User permanently deleted",
            })
            loadUsers()
        } catch (error) {
            toast({
                title: "Failed to Delete User",
                description: "An error occurred while deleting the user",
                variant: "destructive",
            })
        }
    }

    const handleRestore = async (user: User) => {
        try {
            const updatedUser = {
                username: user.username,
                email: user.email,
                roles: user.roles || (user.role ? [user.role] : ['USER']),
                isActive: true
            }
            await userApi.restore(user.id, updatedUser)
            toast({
                title: "Success",
                description: "User restored successfully",
            })
            loadUsers()
        } catch (error) {
            toast({
                title: "Failed to Restore User",
                description: "An error occurred while restoring the user",
                variant: "destructive",
            })
        }
    }

    const handlePasswordReset = async (formData: FormData) => {
        if (!selectedUser) return

        try {
            const newPassword = formData.get("password") as string
            
            if (!newPassword || newPassword.trim() === "") {
                toast({
                    title: "Validation Error",
                    description: "Password is required",
                    variant: "destructive",
                })
                return
            }

            await userApi.resetPassword(selectedUser.id, newPassword)
            toast({
                title: "Success",
                description: "Password reset successfully",
            })
            setIsPasswordResetDialogOpen(false)
            setSelectedUser(null)
        } catch (error) {
            toast({
                title: "Failed to Reset Password",
                description: "An error occurred while resetting the password",
                variant: "destructive",
            })
        }
    }

    const columns: Column<User>[] = [
        {
            key: "id",
            label: "ID",
        },
        {
            key: "username",
            label: "Username",
        },
        {
            key: "email",
            label: "Email",
        },
        {
            key: "role",
            label: "Role",
            render: (user) => {
                const allRoles = getAllRolesDisplay(user)
                const primaryRole = user?.role || (user?.roles && user.roles[0]) || 'USER'
                const variant = getRoleVariant(primaryRole)
                
                return (
                    <div className="space-y-1">
                        <Badge variant={variant}>
                            {allRoles}
                        </Badge>
                        {user?.roles && user.roles.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                                +{user.roles.length - 1} more
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            key: "isActive",
            label: "Status",
            render: (user) => (
                <Badge variant={user.isActive !== false ? "default" : "outline"}>
                    {user.isActive !== false ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            label: "Created",
            render: (user) => new Date(user.createdAt).toLocaleDateString(),
        },
        {
            key: "actions",
            label: "Actions",
            render: (user) => {
                const isCurrentUser = user.id === currentUser?.id
                
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            title="View user details"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setSelectedUser(user)
                                setIsViewDialogOpen(true)
                            }}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                            variant="outline"
                            size="sm"
                            title="Edit user"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                navigate(`/dashboard/users/${user.id}/edit`)
                            }}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>

                        {!isCurrentUser && (
                            <Button
                                variant="outline"
                                size="sm"
                                title="Reset password"
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setSelectedUser(user)
                                    setIsPasswordResetDialogOpen(true)
                                }}
                            >
                                <Key className="h-4 w-4" />
                            </Button>
                        )}
                        
                        {!isCurrentUser && (
                            <>
                                {user.isActive !== false ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            title="Deactivate user"
                                            className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleSoftDelete(user)
                                            }}
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            title="Delete user permanently"
                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                if (confirm(`Are you sure you want to permanently delete user "${user.username}"? This action cannot be undone.`)) {
                                                    handleHardDelete(user)
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        title="Restore user"
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handleRestore(user)
                                        }}
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                )
            },
        },
    ]

    return (
        <div className="space-y-6 p-6">
            <Header 
                title="User Management" 
                description="Manage system users and their permissions"
            />

            <div className="space-y-4">
                {isFilterOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        onClick={() => setIsFilterOpen(false)}
                    />
                )}

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            id="users-search"
                            name="users-search"
                            type="search"
                            placeholder="Search users by name, email, role, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <div className="flex items-center gap-2 relative z-50">
                        <Select
                            value={roleFilter}
                            onValueChange={setRoleFilter}
                            onOpenChange={setIsFilterOpen}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Roles</SelectItem>
                                <SelectItem value="SYSTEM_ADMIN">General Manager</SelectItem>
                                <SelectItem value="INVENTORY_MANAGER">Inventory Manager</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                            onOpenChange={setIsFilterOpen}
                        >
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                            </SelectContent>
                        </Select>

                        {(searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL") && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm("")
                                    setRoleFilter("ALL")
                                    setStatusFilter("ALL")
                                }}
                            >
                                Clear
                            </Button>
                        )}

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Show:</span>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(v) => {
                                    setPageSize(parseInt(v))
                                    setCurrentPage(0)
                                }}
                            >
                                <SelectTrigger className="w-[70px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                    <SelectItem value="150">150</SelectItem>
                                    <SelectItem value="200">200</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    {searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL" 
                        ? `Showing ${Math.min((currentPage * pageSize) + 1, filteredUsers.length)} to ${Math.min((currentPage + 1) * pageSize, filteredUsers.length)} of ${filteredUsers.length} filtered users (${users.length} total)`
                        : `Showing ${Math.min((currentPage * pageSize) + 1, filteredUsers.length)} to ${Math.min((currentPage + 1) * pageSize, filteredUsers.length)} of ${users.length} users`
                    }
                </div>
                <Button onClick={() => navigate("/dashboard/users/add")}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>

            {filteredUsers.length > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                        Page {currentPage + 1} of {totalPages || 1}
                    </div>
                </div>
            )}

            <DataTable 
                columns={columns} 
                data={paginatedUsers} 
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                emptyMessage="No users found" 
            />

            {selectedUser && (
                <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>User Details</DialogTitle>
                            <DialogDescription>
                                View detailed information about this user account
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>ID</Label>
                                <div className="text-sm">{selectedUser.id}</div>
                            </div>
                            <div>
                                <Label>Username</Label>
                                <div className="text-sm">{selectedUser.username}</div>
                            </div>
                            <div>
                                <Label>Email</Label>
                                <div className="text-sm">{selectedUser.email}</div>
                            </div>
                            {selectedUser.fullName && (
                                <div>
                                    <Label>Full Name</Label>
                                    <div className="text-sm">{selectedUser.fullName}</div>
                                </div>
                            )}
                            <div>
                                <Label>Roles</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedUser?.roles && selectedUser.roles.length > 0 ? (
                                        selectedUser.roles.map((role, index) => (
                                            <Badge key={index} variant={getRoleVariant(role)}>
                                                {getRoleDisplayName(role)}
                                            </Badge>
                                        ))
                                    ) : (
                                        <Badge variant={getRoleVariant(selectedUser?.role || 'USER')}>
                                            {getRoleDisplayName(selectedUser?.role || 'USER')}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Badge variant={selectedUser.isActive !== false ? "default" : "outline"}>
                                    {selectedUser.isActive !== false ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                            <div>
                                <Label>Created At</Label>
                                <div className="text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</div>
                            </div>
                            {selectedUser.lastLogin && (
                                <div>
                                    <Label>Last Login</Label>
                                    <div className="text-sm">{new Date(selectedUser.lastLogin).toLocaleString()}</div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {selectedUser && (
                <Dialog open={isPasswordResetDialogOpen} onOpenChange={setIsPasswordResetDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                                Set a new password for user: {selectedUser.username}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            handlePasswordReset(new FormData(e.currentTarget))
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="password">New Password *</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="Enter new password"
                                        className="mt-1"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsPasswordResetDialogOpen(false)
                                            setSelectedUser(null)
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        Reset Password
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}