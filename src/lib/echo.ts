// src/lib/echo.ts
// Laravel Echo client for real-time WebSocket communication via Reverb
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Pusher protocol is used by Laravel Reverb under the hood
(window as unknown as Record<string, unknown>).Pusher = Pusher;

let echoInstance: Echo<'reverb'> | null = null;

export function getEcho(): Echo<'reverb'> {
    if (echoInstance) return echoInstance;

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY ?? 'matchendin-local-key',
        wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
        forceTLS: false,
        enabledTransports: ['ws'],
        authEndpoint: 'http://localhost:8000/broadcasting/auth',
        auth: {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                Accept: 'application/json',
            },
        },
    });

    return echoInstance;
}

/** Refresh the auth token used by Echo (call after login) */
export function refreshEchoAuth(): void {
    if (!echoInstance) return;
    echoInstance.connector.options.auth = {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            Accept: 'application/json',
        },
    };
}

export default getEcho;
