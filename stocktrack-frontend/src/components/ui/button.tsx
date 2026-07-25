import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "app-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border border-primary p-2 bg-primary text-primary-foreground hover:bg-primary/90",
    {
        variants: {
            variant: {
                default: "app-button-default",
                destructive: "app-button-destructive",
                outline: "app-button-outline",
                secondary: "app-button-secondary",
                ghost: "app-button-ghost",
                link: "app-button-link",
            },
            size: {
                default: "app-button-default-size",
                sm: "app-button-sm",
                lg: "app-button-lg",
                icon: "app-button-icon",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                ref={ref}
                className={cn(buttonVariants({ variant, size, className }))}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }


