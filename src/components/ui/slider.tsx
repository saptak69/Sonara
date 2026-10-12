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
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/20 group-hover:h-2 transition-all duration-150">
      <SliderPrimitive.Range className="absolute h-full bg-white transition-colors" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block size-3.5 sm:size-4 rounded-full bg-white shadow-md transition-all duration-150 hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-135 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
