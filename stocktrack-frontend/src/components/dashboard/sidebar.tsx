import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { cn, isUserAdmin } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Package,
    LayoutDashboard,
    Box,
    Users,
    UserCog,
    ArrowLeftRight,
    ClipboardList,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Database,
    BarChart2,
    ShoppingCart,
} from "lucide-react"

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/products", label: "Products", icon: Box },
    { href: "/dashboard/suppliers", label: "Suppliers", icon: Users },
    { href: "/dashboard/adjustments", label: "Stock Adjustments", icon: ArrowLeftRight },
    { href: "/dashboard/transactions", label: "Transactions", icon: ClipboardList },
    { href: "/dashboard/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart2 },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

const adminNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/products", label: "Products", icon: Box },
    { href: "/dashboard/suppliers", label: "Suppliers", icon: Users },
    { href: "/dashboard/adjustments", label: "Stock Adjustments", icon: ArrowLeftRight },
    { href: "/dashboard/transactions", label: "Transactions", icon: ClipboardList },
    { href: "/dashboard/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart2 },
    { href: "/dashboard/users", label: "User Management", icon: UserCog },
    { href: "/dashboard/audit-logs", label: "Audit Logs", icon: FileText },
    { href: "/dashboard/backups", label: "Backups", icon: Database },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export const Sidebar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
    const location = useLocation()
    const { user, signOut, isLoading } = useAuth()
    const [collapsed, setCollapsed] = React.useState(false)

    const [confirmOpen, setConfirmOpen] = React.useState(false)

    const isAdmin = React.useMemo(() => {
        return isUserAdmin(user)
    }, [user, isLoading])

    const shouldShowAdminSection = !isLoading && isAdmin

    return (
        <aside
            ref={ref}
                className={cn(
                    "app-sidebar flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
                    collapsed ? "w-16" : "w-64",
                    className
                )}
                {...props}
        >
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
                <Link to="/dashboard" className={cn("flex items-center gap-2", collapsed && "mx-auto")}>
                    <Package className="h-6 w-6 text-primary" />
                    {!collapsed && <span className="font-semibold text-sidebar-foreground">StockTrack</span>}
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8 text-muted-foreground", collapsed && "mx-auto")}
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            <nav className="flex-1 space-y-1 p-2">
                {(isAdmin ? adminNavItems : navItems).map((item) => {
                    const isActive =
                        location.pathname === item.href || (item.href !== "/dashboard" && location.pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    )
                })}
                
                {shouldShowAdminSection && !isAdmin && (
                    <>
                        {!collapsed && <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</div>}
                        {adminNavItems.map((item) => {
                            const isActive =
                                location.pathname === item.href || (item.href !== "/dashboard" && location.pathname.startsWith(item.href))
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    {!collapsed && <span>{item.label}</span>}
                                </Link>
                            )
                        })}
                    </>
                )}
            </nav>

            <div className="border-t border-sidebar-border p-4">
                {!collapsed && user && (
                    <div className="mb-3 text-sm">
                        <p className="font-medium text-sidebar-foreground">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                )}
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-muted-foreground hover:text-destructive",
                        collapsed && "justify-center px-0"
                    )}
                    onClick={() => setConfirmOpen(true)}
                >
                    <LogOut className="h-5 w-5" />
                    {!collapsed && <span className="ml-3">Sign Out</span>}
                </Button>
            </div>

            {/* Sign out confirmation dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Sign Out</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to sign out?
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => { setConfirmOpen(false); signOut() }}
                        >
                            Sign Out
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </aside>
    )
})
Sidebar.displayName = "Sidebar"


