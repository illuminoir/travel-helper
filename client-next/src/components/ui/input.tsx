import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className="px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...props}
            />
        );
    }
);

Input.displayName = "Input";
