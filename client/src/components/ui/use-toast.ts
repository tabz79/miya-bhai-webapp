import { useCallback } from "react";

type ToastVariant = "default" | "destructive";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

export function useToast() {
  const toast = useCallback(({ title, description, variant = "default" }: ToastOptions) => {
    const msg = title
      ? `${title}${description ? ` — ${description}` : ""}`
      : description ?? "Notification";

    // lightweight MVP version — replace later with shadcn ToastProvider if needed
    if (variant === "destructive") {
      console.error("[Toast:Error]", msg);
      alert(`❌ ${msg}`);
    } else {
      console.log("[Toast]", msg);
      alert(`✅ ${msg}`);
    }
  }, []);

  return { toast };
}
