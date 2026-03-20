'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Mode = 'login' | 'register' | 'forgot';

export default function LoginPage() {
    const { login, register, forgotPassword } = useAuth();
    const router = useRouter();

    const [mode, setMode] = useState<Mode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            if (mode === 'login') {
                await login(email, password);
                router.push('/');
            } else if (mode === 'register') {
                await register(email, password);
                router.push('/');
            } else if (mode === 'forgot') {
                await forgotPassword(email);
                setSuccess('If this email exists, a reset link has been sent.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (m: Mode) => {
        setMode(m);
        setError(null);
        setSuccess(null);
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-background to-muted">

            {/* Left panel — branding */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-foreground text-background p-12">
                <div>
                    <h1 className="text-4xl font-bold">Travel helper</h1>
                    <p className="mt-4 text-lg opacity-70">
                        Organise your travel items, track weights, and pack smarter.
                    </p>
                </div>
                <div className="space-y-6 opacity-50 text-sm">
                    <p>✦ Drag & drop to organise</p>
                    <p>✦ Airline weight limits</p>
                    <p>✦ Presets for every trip</p>
                    <p>✦ Tag and filter your items</p>
                </div>
                <p className="text-xs opacity-30">Travel helper © 2026</p>
            </div>

            {/* Right panel — form */}
            <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 sm:p-12">
                <div className="max-w-sm w-full mx-auto space-y-8">

                    {/* Mode tabs */}
                    {mode !== 'forgot' && (
                        <div className="flex rounded-lg border border-border overflow-hidden">
                            <button
                                onClick={() => switchMode('login')}
                                className={`flex-1 py-2 text-sm font-medium transition-colors cursor-pointer ${
                                    mode === 'login'
                                        ? 'bg-foreground text-background'
                                        : 'bg-background text-foreground hover:bg-muted'
                                }`}
                            >
                                Sign in
                            </button>
                            <button
                                onClick={() => switchMode('register')}
                                className={`flex-1 py-2 text-sm font-medium transition-colors cursor-pointer ${
                                    mode === 'register'
                                        ? 'bg-foreground text-background'
                                        : 'bg-background text-foreground hover:bg-muted'
                                }`}
                            >
                                Register
                            </button>
                        </div>
                    )}

                    {/* Header */}
                    <div>
                        {mode === 'forgot' && (
                            <button
                                onClick={() => switchMode('login')}
                                className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 cursor-pointer"
                            >
                                ← Back to sign in
                            </button>
                        )}
                        <h2 className="text-2xl font-bold">
                            {mode === 'register' && 'Create your account'}
                            {mode === 'forgot' && 'Reset your password'}
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            {mode === 'forgot' && "We'll send a reset link to your email"}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoFocus
                            />
                        </div>

                        {mode !== 'forgot' && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Password</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        {error && <p className="text-sm text-destructive">{error}</p>}
                        {success && <p className="text-sm text-green-600">{success}</p>}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Please wait...' :
                                mode === 'login' ? 'Sign in' :
                                    mode === 'register' ? 'Create account' :
                                        'Send reset link'}
                        </Button>
                    </form>

                    {/* Forgot password link — shown on both login and register */}
                    {mode !== 'forgot' && (
                        <p className="text-center text-sm text-muted-foreground">
                            <button
                                onClick={() => switchMode('forgot')}
                                className="hover:underline cursor-pointer"
                            >
                                Forgot your password?
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}