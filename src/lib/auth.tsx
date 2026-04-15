import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from './axios';
import { refreshEchoAuth } from './echo';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    preferred_language?: 'fr' | 'en';
    profile_type?: string;
    company_name?: string;
    industry?: string;
    company_size?: string;
    website?: string;
    country?: string;
    work_mode?: string;
    salary_min?: string;
    skill_ids?: number[];
    status?: string;
    subscription_tier?: string | null;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User, token: string) => void;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const response = await api.get('/user');
            setUser(response.data);
            refreshEchoAuth();
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = (newUser: User, token: string) => {
        localStorage.setItem('token', token);
        refreshEchoAuth();
        setUser(newUser);
    };

    const logout = async () => {
        try {
            if (localStorage.getItem('token')) {
                await api.post('/logout');
            }
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            const locale = localStorage.getItem('preferred_language') || 'fr';
            window.location.href = `/${locale}/login`;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
