import React, { useState, useEffect } from "react";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: (reason?: string) => void | Promise<void>;
  onCancel: () => void;
  // Strong Confirmation options
  requireTextConfirmation?: string;
  confirmationInputLabel?: string;
  requireReason?: boolean;
  reasonPlaceholder?: string;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
  requireTextConfirmation,
  confirmationInputLabel = "Digite para confirmar:",
  requireReason = false,
  reasonPlaceholder = "Justificativa operacional (mínimo 8 caracteres)...",
}: ConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [reasonText, setReasonText] = useState("");

  // Clean confirmationText and reason upon open or close/cancel/finish
  useEffect(() => {
    setConfirmText("");
    setReasonText("");
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading) return; // Block cancel/close if loading
    if (!nextOpen) {
      setConfirmText("");
      setReasonText("");
      onCancel();
    }
  };

  const handleConfirm = async () => {
    if (loading || !isConfirmEnabled) return;
    try {
      await onConfirm(requireReason ? reasonText.trim() : undefined);
    } finally {
      // Clear inputs upon finish
      setConfirmText("");
      setReasonText("");
    }
  };

  const handleCancel = () => {
    if (loading) return;
    setConfirmText("");
    setReasonText("");
    onCancel();
  };

  const isTextMatch = !requireTextConfirmation || confirmText === requireTextConfirmation;
  const isReasonValid = !requireReason || reasonText.trim().length >= 8;
  const isConfirmEnabled = isTextMatch && isReasonValid;

  const Icon = destructive ? AlertTriangle : ShieldCheck;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        className="max-w-[calc(100%-2rem)] rounded-[2rem] border border-white/70 bg-white p-0 shadow-2xl ring-1 ring-slate-950/5 sm:max-w-md"
        onEscapeKeyDown={(event) => {
          if (loading) event.preventDefault();
        }}
      >
        <div className="overflow-hidden rounded-[2rem]">
          <div
            className={cn(
              "border-b px-6 py-5",
              destructive
                ? "border-red-100 bg-red-50/80"
                : "border-emerald-100 bg-emerald-50/80",
            )}
          >
            <AlertDialogHeader className="grid grid-cols-[auto_1fr] items-start gap-4 text-left">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm",
                  destructive
                    ? "bg-red-600 text-white"
                    : "bg-emerald-600 text-white",
                )}
              >
                <Icon size={22} />
              </div>
              <div className="min-w-0 space-y-2">
                <AlertDialogTitle className="text-xl font-black uppercase italic tracking-tight text-slate-950">
                  {title}
                </AlertDialogTitle>
                {description && (
                  <AlertDialogDescription className="text-sm font-semibold leading-relaxed text-slate-600">
                    {description}
                  </AlertDialogDescription>
                )}
              </div>
            </AlertDialogHeader>
          </div>

          {(requireTextConfirmation || requireReason) && (
            <div className="bg-white px-6 py-4 space-y-4">
              {requireTextConfirmation && (
                <div className="space-y-1.5 text-left">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {confirmationInputLabel}
                  </Label>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={`Digite ${requireTextConfirmation}`}
                    disabled={loading}
                    className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs uppercase"
                  />
                </div>
              )}

              {requireReason && (
                <div className="space-y-1.5 text-left">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Justificativa Operacional
                  </Label>
                  <Textarea
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder={reasonPlaceholder}
                    disabled={loading}
                    className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs font-bold"
                  />
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                    Mínimo de 8 caracteres. Atual: {reasonText.trim().length}
                  </span>
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter className="gap-3 bg-white px-6 py-5 sm:justify-end">
            <AlertDialogCancel
              disabled={loading}
              onClick={handleCancel}
              className="h-12 rounded-2xl border-slate-200 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50"
            >
              {cancelLabel}
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={loading || !isConfirmEnabled}
              onClick={handleConfirm}
              className={cn(
                "h-12 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-70",
                destructive
                  ? "bg-red-600 shadow-red-100 hover:bg-red-700"
                  : "bg-slate-950 shadow-slate-200 hover:bg-emerald-600",
              )}
            >
              {loading && <Loader2 className="mr-2 animate-spin" size={15} />}
              {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
