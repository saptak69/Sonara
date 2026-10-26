import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { tapFeedback } from "@/lib/haptics";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[background-color,opacity,color,transform] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-40 active:enabled:scale-[0.95] active:enabled:transition-transform active:enabled:duration-100 active:enabled:ease-out",
  {
    variants: {
      variant: {
        solid: "bg-fg text-bg hover:bg-fg/90",
        accent: "bg-accent text-accent-fg font-semibold hover:bg-accent-hover",
        ghost: "bg-transparent text-fg hover:bg-hover",
        chip: "bg-surface-2 text-fg hover:bg-surface-3",
        icon: "bg-transparent text-muted hover:text-fg hover:bg-hover",
      },
      size: {
        sm: "h-8 rounded-pill px-3 text-xs",
        md: "h-10 rounded-pill px-4 text-sm",
        lg: "h-12 rounded-pill px-6 text-sm",
        icon: "size-10 rounded-full",
        iconSm: "size-8 rounded-full",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  onPointerDown,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    tapFeedback();
    onPointerDown?.(e);
  };

  return (
    <Comp 
      className={cn(buttonVariants({ variant, size }), className)} 
      onPointerDown={handlePointerDown}
      {...props} 
    />
  );
}
