import { useContext } from 'react';
import { AlertContext } from './alertContext';

export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used inside AlertProvider');
    }

    return context;
}