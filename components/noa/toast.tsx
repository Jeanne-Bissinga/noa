"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";

// Notifications éphémères.
//
// Certaines actions n'ont pas de trace visible à l'écran : copier un lien dans
// le presse-papiers ne change rien de ce que l'on voit, et sans retour on ne
// sait pas si le geste a marché. Un toast répond à ça, et à ça seulement.
//
// Il ne remplace pas l'affichage d'une erreur dans le formulaire qui l'a
// produite : là où le message doit rester lisible le temps de corriger, il a sa
// place dans la page, pas dans une bulle qui disparaît.

type ToastTone = "success" | "error";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const DURATION_MS = 3500;

const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(null);

/**
 * Déclenche un toast. Utilisable depuis n'importe quel composant client sous
 * le ToastProvider — sans lui, l'appel ne fait rien plutôt que de lever : un
 * retour visuel manquant ne doit jamais casser l'action qu'il accompagne.
 */
export function useToast() {
  const show = useContext(ToastContext);
  return useCallback(
    (message: string, tone: ToastTone = "success") => {
      show?.(message, tone);
    },
    [show],
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, tone: ToastTone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), DURATION_MS);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  // `show` est stable : le contexte ne change pas d'identité à chaque toast,
  // donc afficher un toast ne rerend pas tout l'arbre.
  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 pl-3.5 pr-2.5 py-2.5 rounded-xl shadow-lg border text-sm font-medium max-w-sm ${
              toast.tone === "success"
                ? "bg-[#010101] border-[#010101] text-white"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            {toast.tone === "success" ? (
              <Check size={14} className="text-[#75DA9F] flex-shrink-0" />
            ) : (
              <AlertTriangle size={14} className="flex-shrink-0" />
            )}
            <span className="leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Fermer"
              className={`p-0.5 rounded-md transition-colors flex-shrink-0 ${
                toast.tone === "success" ? "text-white/40 hover:text-white" : "text-red-300 hover:text-red-500"
              }`}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
