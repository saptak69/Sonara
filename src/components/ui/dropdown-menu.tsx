import * as Dropdown from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Dropdown.Root;
export const DropdownMenuTrigger = Dropdown.Trigger;

export function DropdownMenuContent({
  className,
  ...props
}: ComponentProps<typeof Dropdown.Content>) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content
        sideOffset={8}
        collisionPadding={12}
        className={cn(
          "z-[100] min-w-56 overflow-hidden rounded-xl bg-[#1E1A18] border border-white/[0.08] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.7)] font-sans text-[13px] text-white tracking-normal",
          "origin-(--radix-dropdown-menu-content-transform-origin)",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          className,
        )}
        {...props}
      />
    </Dropdown.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof Dropdown.Item>) {
  return (
    <Dropdown.Item
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-normal text-white/90 outline-none transition-colors select-none",
        "data-[highlighted]:bg-white/[0.08] data-[highlighted]:text-white data-[disabled]:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator() {
  return <Dropdown.Separator className="my-1 h-px bg-white/[0.08]" />;
}
