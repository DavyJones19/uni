"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type FormModalShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  submitLabel: React.ReactNode;
  cancelLabel?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onSubmit: () => void | Promise<void>;
  children: React.ReactNode;
  contentClassName?: string;
  submitClassName?: string;
};

export function FormModalShell({
  open,
  onOpenChange,
  title,
  submitLabel,
  cancelLabel = "Cancelar",
  loading = false,
  error,
  onSubmit,
  children,
  contentClassName = "sm:max-w-[425px]",
  submitClassName = "bg-sky-600 hover:bg-sky-500",
}: FormModalShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        <div className="gap-3 py-2">
          <div className="flex flex-col gap-2">{children}</div>
        </div>
        {error ? (
          <div className="-mt-1 rounded-md bg-red-50 p-2">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        ) : null}
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-8 px-3 text-xs"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={loading}
            className={`h-8 px-3 text-xs ${submitClassName}`}
          >
            {loading ? "Guardando..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
