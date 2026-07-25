import * as React from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    value: string | number
    description?: string
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
    ({ title, value, description, icon: Icon, trend, className, ...props }, ref) => {
        return (
            <Card ref={ref} className={cn("app-stat-card border-border/50", className)} {...props}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-card-foreground">{value}</div>
                    {(description || trend) && (
                        <p className="text-xs text-muted-foreground">
                            {trend && (
                                <span
                                    className={cn("mr-1", trend.isPositive ? "text-success" : "text-destructive")}
                                >
                                    {trend.isPositive ? "+" : ""}
                                    {trend.value}%
                                </span>
                            )}
                            {description}
                        </p>
                    )}
                </CardContent>
            </Card>
        )
    }
)
StatCard.displayName = "StatCard"


