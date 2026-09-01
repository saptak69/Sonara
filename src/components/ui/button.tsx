import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[transform,background-color,opacity,color] duration-150 ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40 disabled:pointer-events-none disabled:opacity-40 active:enabled:scale-[0.96]",
  {
    variants: {
      variant: {
        solid: "bg-fg text-bg hover:bg-fg/90",
        accent: "bg-accent text-accent-fg hover:bg-accent/90",
        ghost: "bg-transparent text-fg hover:bg-hover",
        chip: "bg-chip text-fg hover:bg-hover",
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
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
