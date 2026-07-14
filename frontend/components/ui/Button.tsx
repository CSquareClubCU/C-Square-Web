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
          "inline-flex items-center justify-center whitespace-nowrap rounded-[8px] text-[14px] font-semibold transition-all duration-200 disabled:pointer-events-none disabled:bg-[#e5e7eb] disabled:text-[#6b7280]",
          // Variants
          variant === "primary" && "bg-[var(--c-accent)] text-[var(--c-background)] hover:bg-[var(--c-accent-hover)] hover:scale-[1.02]",
          variant === "secondary" && "bg-transparent border border-gray-300 text-[var(--c-accent)] hover:border-gray-400",
          variant === "outline" && "border border-[var(--c-border)] bg-transparent hover:bg-gray-50 text-[var(--c-accent)]",
          variant === "ghost" && "bg-transparent hover:bg-gray-100 text-[var(--c-accent)]",
          // Sizes
          size === "default" && "px-5 py-2.5 h-[40px]",
          size === "sm" && "px-4 py-2 h-[32px] text-xs",
          size === "lg" && "px-8 py-4 h-[48px] text-base",
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
