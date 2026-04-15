import { createContext } from 'react';

export type AlertSeverity = 'success' | 'error' | 'warning' | 'info';

export interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    inputLabel?: string;
    inputPlaceholder?: string;
    inputDefaultValue?: string;
    onConfirm?: (inputValue?: string) => void | Promise<void>;
    onCancel?: () => void;
    tone?: 'danger' | 'default';
}

export interface PremiumGateOptions {
    title?: string;
    message?: string;
    discoverText?: string;
    laterText?: string;
    onDiscover?: () => void;
}

export interface NotifyOptions {
    severity?: AlertSeverity;
    title?: string;
    message: string;
    durationMs?: number;
}

export interface AlertContextValue {
    notify: (options: NotifyOptions) => void;
    error: (message: string, title?: string) => void;
    confirm: (options: ConfirmOptions) => void;
    premiumGate: (options?: PremiumGateOptions) => void;
}

export const AlertContext = createContext<AlertContextValue | undefined>(undefined);