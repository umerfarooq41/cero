"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { AppSheetKeyboard } from "@/hooks/useAppSheetKeyboard"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "app-sheet-overlay fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props} />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(({ className, children, onOpenAutoFocus, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      onOpenAutoFocus={(event) => {
        if (onOpenAutoFocus) return onOpenAutoFocus(event);
        if (window.matchMedia("(min-width: 768px)").matches) return;
        event.preventDefault();
        const dialog = event.currentTarget;
        if (dialog.querySelector(".app-dialog-scroll input:not([type=hidden]):not([disabled])")) {
          window.setTimeout(() => {
            if (!dialog.isConnected) return;
            dialog.querySelector(".app-dialog-scroll input:not([type=hidden]):not([disabled])")?.focus({ preventScroll: true });
          }, 260);
        }
      }}
      className={cn(
        "app-sheet-surface app-desktop-modal cero-dialog fixed bottom-0 left-0 z-50 w-full max-w-lg gap-3 p-4 duration-[220ms] ease-out md:bottom-auto md:left-[50%] md:top-[50%] md:w-[calc(100%-1rem)] md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-2xl md:p-5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95 md:data-[state=closed]:slide-out-to-left-1/2 md:data-[state=closed]:slide-out-to-top-[48%] md:data-[state=open]:slide-in-from-left-1/2 md:data-[state=open]:slide-in-from-top-[48%] md:w-full",
        className
      )}
      {...props}>
      <AppSheetKeyboard />
      {children}
      <DialogPrimitive.Close
        className="cero-dialog-close absolute right-4 top-4 z-20 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("cero-dialog-header flex shrink-0 flex-col space-y-1 text-left pr-10", className)}
    {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("cero-dialog-footer flex flex-col-reverse md:flex-row md:justify-end md:space-x-2", className)}
    {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("cero-dialog-title text-base font-semibold leading-tight tracking-normal", className)}
    {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("cero-dialog-description text-sm text-muted-foreground", className)}
    {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
