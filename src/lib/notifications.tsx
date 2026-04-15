import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './axios';
import { useAuth } from './auth';
import { getEcho } from './echo';

export type NotificationItem = {
    id: string;
    type: string;
    title: string;
    body: string;
    action_url?: string | null;
    severity: 'info' | 'warning' | 'critical' | string;
    entity?: Record<string, unknown>;
    meta?: Record<string, unknown>;
    read_at?: string | null;
    created_at: string;
};

type NotificationContextValue = {
    unreadCount: number;
    isUnreadLoading: boolean;
    markAsRead: (ids: string[]) => Promise<void>;
    markAllAsRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const queryClient = useQueryClient();

    const { data: unreadData, isLoading: isUnreadLoading } = useQuery<{ count: number }>({
        queryKey: ['notifications-unread-count'],
        queryFn: async () => {
            const res = await api.get('/notifications/unread-count');
            return res.data;
        },
        enabled: isAuthenticated,
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (ids: string[]) => api.patch('/notifications/read', { notification_ids: ids }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
        },
    });

    const markAllMutation = useMutation({
        mutationFn: async () => api.patch('/notifications/read-all'),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
        },
    });

    useEffect(() => {
        if (!isAuthenticated || !user?.id) {
            return;
        }

        const echo = getEcho();
        const channelName = `App.Models.User.${user.id}`;
        const channel = echo.private(channelName) as unknown as {
            notification?: (callback: (payload: unknown) => void) => void;
        };

        const onIncoming = () => {
            queryClient.setQueryData<{ count: number }>(
                ['notifications-unread-count'],
                (current) => ({ count: (current?.count ?? 0) + 1 })
            );
            void queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        };

        if (typeof channel.notification === 'function') {
            channel.notification(onIncoming);
        }

        return () => {
            echo.leave(channelName);
        };
    }, [isAuthenticated, queryClient, user?.id]);

    useEffect(() => {
        if (!isAuthenticated) {
            queryClient.setQueryData(['notifications-unread-count'], { count: 0 });
        }
    }, [isAuthenticated, queryClient]);

    const value = useMemo<NotificationContextValue>(
        () => ({
            unreadCount: unreadData?.count ?? 0,
            isUnreadLoading,
            markAsRead: async (ids: string[]) => {
                if (ids.length === 0) {
                    return;
                }
                await markAsReadMutation.mutateAsync(ids);
            },
            markAllAsRead: async () => {
                await markAllMutation.mutateAsync();
            },
        }),
        [isUnreadLoading, markAllMutation, markAsReadMutation, unreadData?.count]
    );

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }

    return context;
}
