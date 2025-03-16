import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost" | "destructive";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition",
                    variant === "default" && "bg-blue-500 text-white hover:bg-blue-600",
                    variant === "outline" && "border border-gray-300 hover:bg-gray-100",
                    variant === "ghost" && "text-gray-600 hover:bg-gray-100",
                    variant === "destructive" && "bg-red-500 text-white hover:bg-red-600",
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";
