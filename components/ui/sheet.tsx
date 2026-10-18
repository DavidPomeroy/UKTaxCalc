"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SheetProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Root>;

function Sheet({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

export type SheetTriggerProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Trigger>;

const SheetTrigger = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Trigger>,
  SheetTriggerProps
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Trigger
    ref={ref}
    className={cn(className)}
    {...props}
  />
));
SheetTrigger.displayName = SheetPrimitive.Trigger.displayName;

export type SheetContentProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ className, children, ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="inset-0 z-50 bg-black/80" />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 grid w-full max-w-lg gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=closed]:slide-in-to-right-full data-[state=open]:slide-in-from-right-full sm:rounded-lg sm:border",
        className
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4">
        <X className="h-4 w-4" />
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

export type SheetHeaderProps = React.HTMLAttributes<HTMLDivElement>;

function SheetHeader({ className, ...props }: SheetHeaderProps) {
  return (
    <div
      className={cn("grid gap-1.5 pb-6", className)}
      {...props}
    />
  );
}
SheetHeader.displayName = "SheetHeader";

export type SheetTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

function SheetTitle({ className, ...props }: SheetTitleProps) {
  return (
    <h2
      className={cn(
        "text-2xl font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  );
}
SheetTitle.displayName = "SheetTitle";

export type SheetDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

function SheetDescription({ className, ...props }: SheetDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};
