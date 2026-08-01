"use client";
import { CheckCircle2, XCircle } from "lucide-react";
import { Theme } from "@/lib/types";

export type ToastState = { message: string; type: "success" | "error" } | null;

export default function Toast({ toast, T }: { toast: ToastState; T: Theme }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border px-4 py-2.5 text-xs shadow-lg sm:bottom-6"
      style={{
        background: T.surface,
        borderColor: isError ? `${T.red}66` : `${T.green}66`,
        color: T.textHi,
      }}
    >
      {isError ? (
        <XCircle size={15} style={{ color: T.red }} />
      ) : (
        <CheckCircle2 size={15} style={{ color: T.green }} />
      )}
      {toast.message}
    </div>
  );
}
