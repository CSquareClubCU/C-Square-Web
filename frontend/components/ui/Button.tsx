import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-[12px] text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
          // Variants
          variant === "primary" && "bg-[var(--c-accent)] text-[var(--c-background)] hover:bg-[var(--c-accent-hover)] hover:scale-[1.02]",
          variant === "secondary" && "bg-transparent border border-gray-300 text-[var(--c-accent)] hover:border-gray-400",
          variant === "outline" && "border border-[var(--c-border)] bg-transparent hover:bg-gray-50 text-[var(--c-accent)]",
          variant === "ghost" && "bg-transparent hover:bg-gray-100 text-[var(--c-accent)]",
          // Sizes
          size === "default" && "px-7 py-3.5",
          size === "sm" && "px-4 py-2 text-xs",
          size === "lg" && "px-8 py-4 text-base",
          size === "icon" && "h-10 w-10",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
