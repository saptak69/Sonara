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
        className={cn(
          "z-50 min-w-52 overflow-hidden rounded-lg bg-elevated p-1 shadow-pop",
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
        "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-fg outline-none",
        "data-[highlighted]:bg-hover data-[disabled]:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator() {
  return <Dropdown.Separator className="my-1 h-px bg-border" />;
}
