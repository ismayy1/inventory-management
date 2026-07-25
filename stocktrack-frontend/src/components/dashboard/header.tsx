import * as React from "react"
import { Bell, Search, User, Clock, AlertCircle, CheckCircle, Info, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/lib/notification-context"

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
    title: string
    description?: string
}

export const Header = React.forwardRef<HTMLElement, HeaderProps>(
    ({ title, description, className, ...props }, ref) => {
        const { user } = useAuth()
        const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications()
        const [showNotifications, setShowNotifications] = React.useState(false)
        const notificationRef = React.useRef<HTMLDivElement>(null)

        React.useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                    setShowNotifications(false)
                }
            }

            if (showNotifications) {
                document.addEventListener('mousedown', handleClickOutside)
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside)
            }
        }, [showNotifications])

        const getNotificationIcon = (type: string) => {
            switch (type.toLowerCase()) {
                case "success":
                    return <CheckCircle className="h-4 w-4 text-green-500" />
                case "warning":
                    return <AlertCircle className="h-4 w-4 text-yellow-500" />
                case "error":
                    return <AlertCircle className="h-4 w-4 text-red-500" />
                default:
                    return <Info className="h-4 w-4 text-blue-500" />
            }
        }

        const formatTimeAgo = (dateString: string) => {
            const date = new Date(dateString)
            const now = new Date()
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

            if (diffInSeconds < 60) return "Just now"
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
            if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
            return date.toLocaleDateString()
        }

        const getRoleDisplay = (role: string) => {
            const roleLower = role?.toLowerCase() || ""
            if (roleLower.includes("admin")) return "Admin"
            if (roleLower.includes("inventory") || roleLower.includes("manager")) return "Inventory Manager"
            return role || "User"
        }

        const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
            const roleLower = role?.toLowerCase() || ""
            if (roleLower.includes("admin")) return "default"
            if (roleLower.includes("inventory") || roleLower.includes("manager")) return "secondary"
            return "outline"
        }

        return (
            <header
                ref={ref}
                className={cn(
                    "app-header sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border",
                    "bg-card/70 backdrop-blur-md supports-[backdrop-filter]:bg-card/60",
                    "px-6 transition-colors duration-200",
                    className
                )}

                {...props}
            >
                <div>
                    <h1 className="text-xl font-semibold text-card-foreground">{title}</h1>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            id="header-search"
                            name="header-search"
                            type="search"
                            placeholder="Search..."
                            className="w-64"
                        />
                    </div>

                    <div className="relative" ref={notificationRef}>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground relative"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <Badge 
                                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white"
                                >
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </Badge>
                            )}
                        </Button>

                        {showNotifications && (
                            <Card className="absolute right-0 top-12 w-80 max-h-96 overflow-hidden shadow-lg border z-50">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                                        <div className="flex items-center gap-2">
                                            {unreadCount > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs h-6 px-2"
                                                    onClick={markAllAsRead}
                                                >
                                                    Mark all read
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => setShowNotifications(false)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-80 overflow-y-auto">
                                        {isLoading ? (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                Loading notifications...
                                            </div>
                                        ) : notifications.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                No notifications
                                            </div>
                                        ) : (
                                            notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={cn(
                                                        "p-3 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors",
                                                        !notification.isRead && "bg-blue-50/50"
                                                    )}
                                                    onClick={() => markAsRead(notification.id)}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {getNotificationIcon(notification.type)}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-foreground truncate">
                                                                    {notification.title}
                                                                </p>
                                                                {!notification.isRead && (
                                                                    <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1 overflow-hidden" style={{
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical'
                                                            }}>
                                                                {notification.message}
                                                            </p>
                                                            <div className="flex items-center gap-1 mt-2">
                                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-xs text-muted-foreground">
                                                                    {formatTimeAgo(notification.createdAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    {notifications.length > 0 && (
                                        <div className="p-3 border-t border-border">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-xs"
                                            >
                                                View all notifications
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {user && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-medium text-card-foreground">{user.username}</span>
                                <Badge
                                    variant={getRoleVariant(user.role || 'USER')}
                                    className="text-xs h-5 px-1.5 mt-0.5"
                                >
                                    {getRoleDisplay(user.role || 'USER')}
                                </Badge>
                            </div>
                        </div>
                    )}
                </div>
            </header>
        )
    }
)

Header.displayName = "Header"


