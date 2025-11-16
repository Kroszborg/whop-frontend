import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import React, { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";

const retroButtonVariants = cva(
  "retro-btn-base",
  {
    variants: {
      variant: {
        yellow: "retro-btn-yellow",
        orange: "retro-btn-orange",
        green: "retro-btn-green",
        purple: "retro-btn-purple",
        blue: "retro-btn-blue",
        red: "retro-btn-red",
      },
      size: {
        sm: "retro-btn-sm",
        md: "retro-btn-md",
        lg: "retro-btn-lg",
        xl: "retro-btn-xl",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "yellow",
    },
  },
);

export interface RetroButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof retroButtonVariants> {
  asChild?: boolean;
  icon?: React.ReactNode;
}

export const RetroButton = React.forwardRef<HTMLButtonElement, RetroButtonProps>(
  (
    {
      children,
      size = "md",
      className = "",
      variant = "yellow",
      asChild = false,
      icon,
      ...props
    }: RetroButtonProps,
    forwardedRef,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={forwardedRef}
        className={cn(retroButtonVariants({ variant, size }), className)}
        {...props}
      >
        {icon && <span className="inline-flex items-center">{icon}</span>}
        {children}
      </Comp>
    );
  },
);

RetroButton.displayName = "RetroButton";
