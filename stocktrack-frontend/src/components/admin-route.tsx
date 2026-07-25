import { Navigate } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { isUserAdmin } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

interface AdminRouteProps {
    children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/signin" replace />
    }

    if (!isUserAdmin(user)) {
        return (
            <div className="flex h-full items-center justify-center p-6">
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
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Contact your system administrator if you believe you should have access to this resource.
                        </p>
                        <div className="mt-2 text-xs text-muted-foreground">
                            Current user: {user.username} (Role: {user.role || 'undefined'})
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return <>{children}</>
}