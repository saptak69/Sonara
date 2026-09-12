import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center py-2 cursor-pointer group",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-surface/50 border border-border/50">
      <SliderPrimitive.Range className="absolute h-full bg-accent transition-colors" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block size-2.5 sm:size-3 rotate-45 rounded-[1px] border border-accent bg-surface shadow-md transition-all duration-200 hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-110 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing [transition-property:scale,background-color,border-color,box-shadow]" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
