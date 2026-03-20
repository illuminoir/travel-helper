'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

type User = { id: number; email: string };

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (token: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchMe = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMe();
    }, [fetchMe]);

    const login = async (email: string, password: string) => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error ?? 'Login failed');
        }
        const data = await res.json();
        setUser(data);
    };

    const register = async (email: string, password: string) => {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error ?? 'Registration failed');
        }
        const data = await res.json();
        setUser(data);
    };

    const logout = async () => {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
        setUser(null);
    };

    const forgotPassword = async (email: string) => {
        const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email }),
        });
        if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error ?? 'Failed to send reset email');
        }
    };

    const resetPassword = async (token: string, password: string) => {
        const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ token, password }),
        });
        if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error ?? 'Failed to reset password');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, forgotPassword, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}