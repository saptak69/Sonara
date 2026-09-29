import * as D from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;
export const DialogTitle = D.Title;
export const DialogDescription = D.Description;

export function DialogContent({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <D.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2",
          "rounded-2xl bg-neutral-900/95 border border-white/15 p-5 shadow-2xl backdrop-blur-2xl text-fg",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className,
        )}
      >
        {title ? (
          <div className="mb-4 flex items-center justify-between gap-3">
            <D.Title className="text-lg font-semibold tracking-tight">{title}</D.Title>
            <D.Close className="grid size-8 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-fg transition-colors">
              <X className="size-4" />
            </D.Close>
          </div>
        ) : (
          <D.Title className="sr-only">Dialog</D.Title>
        )}
        {children}
      </D.Content>
    </D.Portal>
  );
}
