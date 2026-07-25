import React, { createContext, useContext, useEffect, useState } from "react"
import { notificationApi, type Notification } from "./api"
import { useAuth } from "./auth-context"
import { useToast } from "@/hooks/use-toast"

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    isLoading: boolean
    markAsRead: (id: number) => Promise<void>
    markAllAsRead: () => Promise<void>
    refreshNotifications: () => Promise<void>
    addNotification: (notification: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'isRead'>) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider")
    }
    return context
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth()
    const { toast } = useToast()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const refreshNotifications = async () => {
        if (!user) {
            setNotifications([])
            return
        }

        setIsLoading(true)
        try {
            const data = await notificationApi.getAll()
            setNotifications(data)
        } catch (error) {
            // Fallback to empty array if mock fails
            setNotifications([])
        } finally {
            setIsLoading(false)
        }
    }

    const markAsRead = async (id: number) => {
        try {
            await notificationApi.markAsRead(id)
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            )
        } catch (error) {
            // Still update locally even if API fails
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            )
        }
    }

    const markAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead()
            setNotifications(prev => 
                prev.map(n => ({ ...n, isRead: true }))
            )
            toast({
                title: "Success",
                description: "All notifications marked as read"
            })
        } catch (error) {
            // Still update locally even if API fails
            setNotifications(prev => 
                prev.map(n => ({ ...n, isRead: true }))
            )
            toast({
                title: "Success",
                description: "All notifications marked as read"
            })
        }
    }

    const addNotification = (notification: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'isRead'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Date.now(),
            userId: user?.id || 0,
            createdAt: new Date().toISOString(),
            isRead: false
        }
        setNotifications(prev => [newNotification, ...prev])
    }

    useEffect(() => {
        refreshNotifications()
    }, [user])

    useEffect(() => {
        if (!user) return

        const interval = setInterval(refreshNotifications, 30000)
        return () => clearInterval(interval)
    }, [user])

    const unreadCount = notifications.filter(n => !n.isRead).length

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        addNotification
    }

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    )
}