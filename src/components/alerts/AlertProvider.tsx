import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  CrownIcon,
} from "hugeicons-react";

import {
  AlertContext,
  type AlertContextValue,
  type AlertSeverity,
  type ConfirmOptions,
  type PremiumGateOptions,
  type NotifyOptions,
} from "./alertContext";

interface ToastAlert {
  id: number;
  severity: AlertSeverity;
  title?: string;
  message: string;
  durationMs: number | null;
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [premiumState, setPremiumState] = useState<PremiumGateOptions | null>(
    null,
  );
  const [isModalBusy, setIsModalBusy] = useState(false);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ severity = "info", title, message, durationMs }: NotifyOptions) => {
      // Error toasts stay visible until the user dismisses them manually.
      const resolvedDuration =
        severity === "error" ? null : durationMs ?? 3400;
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const nextToast: ToastAlert = {
        id,
        severity,
        title,
        message,
        durationMs: resolvedDuration,
      };

      setToasts((prev) => [...prev, nextToast].slice(-4));
      if (resolvedDuration !== null) {
        window.setTimeout(() => dismissToast(id), resolvedDuration);
      }
    },
    [dismissToast],
  );

  const error = useCallback(
    (message: string, title?: string) => {
      notify({ severity: "error", title, message });
    },
    [notify],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmInput(options.inputDefaultValue || "");
    setConfirmState(options);
  }, []);

  const premiumGate = useCallback((options?: PremiumGateOptions) => {
    setPremiumState(options ?? {});
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!confirmState?.onConfirm) {
      setConfirmState(null);
      setConfirmInput("");
      return;
    }

    try {
      setIsModalBusy(true);
      await confirmState.onConfirm(
        confirmState.inputLabel ? confirmInput : undefined,
      );
      setConfirmState(null);
      setConfirmInput("");
    } finally {
      setIsModalBusy(false);
    }
  }, [confirmState, confirmInput]);

  const handleCancelConfirm = useCallback(() => {
    confirmState?.onCancel?.();
    setConfirmState(null);
    setConfirmInput("");
  }, [confirmState]);

  const value = useMemo<AlertContextValue>(
    () => ({
      notify,
      error,
      confirm,
      premiumGate,
    }),
    [notify, error, confirm, premiumGate],
  );

  return (
    <AlertContext.Provider value={value}>
      {children}

      <div className="fixed top-24 right-4 z-130 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={() => dismissToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmState && (
          <ModalShell onClose={handleCancelConfirm}>
            <h2 className="text-xl font-black uppercase tracking-widest mb-3">
              {confirmState.title}
            </h2>
            <p className="text-slate-400 text-sm font-bold tracking-wider leading-relaxed mb-8">
              {confirmState.message}
            </p>

            {confirmState.inputLabel && (
              <div className="text-left mb-8 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">
                  {confirmState.inputLabel}
                </label>
                <textarea
                  rows={4}
                  value={confirmInput}
                  onChange={(event) => setConfirmInput(event.target.value)}
                  placeholder={confirmState.inputPlaceholder || ""}
                  className="w-full px-4 py-3 app-input border app-border rounded-2xl text-sm font-bold tracking-wide focus:outline-none focus:border-emerald-500/40 resize-none"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled={isModalBusy}
                onClick={handleCancelConfirm}
                className="py-3 bg-white/5 hover:bg-white/10 rounded-full text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                {confirmState.cancelText || "Cancel"}
              </button>
              <button
                type="button"
                disabled={isModalBusy}
                onClick={handleConfirm}
                className={`py-3 rounded-full text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50 ${
                  confirmState.tone === "danger"
                    ? "bg-red-500 hover:bg-red-400 text-black shadow-lg shadow-red-500/20"
                    : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20"
                }`}
              >
                {isModalBusy ? "..." : confirmState.confirmText || "Confirm"}
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {premiumState && (
          <ModalShell onClose={() => setPremiumState(null)}>
            <div className="absolute -top-12.5 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-[60px] pointer-events-none" />

            <div className="w-20 h-20 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CrownIcon size={40} />
            </div>

            <h2 className="text-2xl font-black uppercase tracking-widest mb-4">
              {premiumState.title || "Premium Feature"}
            </h2>
            <p className="text-slate-400 text-sm font-bold tracking-wider leading-relaxed mb-8">
              {premiumState.message ||
                "Upgrade to unlock this premium feature."}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPremiumState(null)}
                className="py-4 bg-white/5 hover:bg-white/10 rounded-full text-xs font-black uppercase tracking-widest transition-colors"
              >
                {premiumState.laterText || "Later"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPremiumState(null);
                  premiumState.onDiscover?.();
                }}
                className="py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-full text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-amber-500/20"
              >
                {premiumState.discoverText || "Discover"}
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
}

function ModalShell({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-140 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(event) => event.stopPropagation()}
        className="app-panel border border-white/10 rounded-4xl p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: ToastAlert;
  onClose: () => void;
}) {
  const styles: Record<
    AlertSeverity,
    { icon: ReactNode; title: string; container: string; bar: string }
  > = {
    success: {
      icon: <CheckmarkCircle02Icon size={18} />,
      title: "Success",
      container: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      bar: "bg-emerald-400",
    },
    error: {
      icon: <Alert02Icon size={18} />,
      title: "Error",
      container: "border-red-500/30 bg-red-500/10 text-red-300",
      bar: "bg-red-400",
    },
    warning: {
      icon: <Alert02Icon size={18} />,
      title: "Warning",
      container: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      bar: "bg-amber-400",
    },
    info: {
      icon: <InformationCircleIcon size={18} />,
      title: "Info",
      container: "border-blue-500/30 bg-blue-500/10 text-blue-300",
      bar: "bg-blue-400",
    },
  };

  const visual = styles[toast.severity];

  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95 }}
      className={`relative overflow-hidden rounded-2xl border p-4 ${visual.container}`}
    >
      <div className="flex items-start gap-3 pr-8">
        <div className="mt-0.5">{visual.icon}</div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">
            {toast.title || visual.title}
          </p>
          <p className="text-sm font-bold tracking-wide text-white/90">
            {toast.message}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 text-xs font-black"
      >
        x
      </button>

      {toast.durationMs !== null && (
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: 0 }}
          transition={{ duration: toast.durationMs / 1000, ease: "linear" }}
          className={`absolute bottom-0 left-0 h-1 ${visual.bar}`}
        />
      )}
    </motion.div>
  );
}
