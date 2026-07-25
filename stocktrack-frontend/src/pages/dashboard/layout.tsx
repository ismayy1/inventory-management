import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/dashboard/sidebar"
import { useAuth } from "@/lib/auth-context"

export default function DashboardLayout() {
    const { user } = useAuth()
    
    return (
        <div className="app-dashboard-layout flex h-screen bg-background">
            <Sidebar key={user?.id || 'no-user'} />
            <main className="app-dashboard-main flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    )
}
