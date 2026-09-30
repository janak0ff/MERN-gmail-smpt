import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api';

const AuthPage = ({ onAuthenticated }) => {
    const params = React.useMemo(() => new URLSearchParams(window.location.search), []);
    const [mode, setMode] = useState(params.has('resetToken') ? 'reset-password' : 'login');
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    React.useEffect(() => {
        const token = params.get('verifyToken');
        const email = params.get('verifyEmail');
        if (token && email) {
            api.post('/auth/verify-email', { token, email })
                .then(() => toast.success('Email verified successfully'))
                .catch(error => toast.error(error.response?.data?.message || 'Verification link is invalid or expired'))
                .finally(() => window.history.replaceState({}, '', window.location.pathname));
        }
    }, [params]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            if (mode === 'forgot-password') {
                await api.post('/auth/forgot-password', { email: form.email });
                toast.success('If an account exists, reset instructions have been sent.');
                setMode('login');
            } else if (mode === 'reset-password') {
                await api.post('/auth/reset-password', { email: params.get('resetEmail') || form.email, token: params.get('resetToken'), password: form.password });
                toast.success('Password reset. You can now sign in.');
                window.history.replaceState({}, '', window.location.pathname);
                setMode('login');
            } else {
                const response = await api.post(`/auth/${mode}`, form);
                onAuthenticated(response.data.user);
                toast.success(mode === 'login' ? 'Welcome back!' : 'Account created. Check your email to verify it.');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const isRegister = mode === 'register';
    const isRecovery = mode === 'forgot-password' || mode === 'reset-password';
    const passwordScore = form.password.length >= 12 ? 'Strong password' : form.password.length >= 8 ? 'Good password' : '';

    return (
        <main className="auth-page">
            <section className="auth-shell">
                <aside className="auth-showcase">
                    <div className="auth-brand"><span className="auth-brand-mark"><Mail size={20} /></span> Quick Mail</div>
                    <div className="auth-showcase-copy">
                        <span className="auth-kicker">Your email workspace</span>
                        <h1>Send clearly.<br /><em>Stay organized.</em></h1>
                        <p>Compose, deliver, and track important messages from one calm, focused workspace.</p>
                    </div>
                    <div className="auth-trust"><ShieldCheck size={17} /> Secure account access</div>
                </aside>

                <div className="auth-card">
                    <div className="auth-mobile-brand"><span className="auth-brand-mark"><Mail size={20} /></span> Quick Mail</div>
                    <div className="auth-heading">
                        <span className="auth-kicker">{isRegister ? 'Get started' : isRecovery ? 'Account recovery' : 'Welcome back'}</span>
                        <h2>{isRegister ? 'Create your account' : mode === 'reset-password' ? 'Choose a new password' : mode === 'forgot-password' ? 'Reset your password' : 'Sign in to Quick Mail'}</h2>
                        <p>{isRegister ? 'Set up your secure email workspace in a few seconds.' : isRecovery ? 'We will help you get back into your workspace.' : 'Continue to your email workspace.'}</p>
                    </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    {isRegister && (
                        <label className="input-group">
                            <span className="auth-field-label">Name</span>
                            <div className="auth-input-wrap"><UserRound size={18} /><input placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoComplete="name" /></div>
                        </label>
                    )}
                    <label className="input-group">
                        <span className="auth-field-label">Email address</span>
                        <div className="auth-input-wrap"><Mail size={18} /><input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required autoComplete="email" /></div>
                    </label>
                    {mode !== 'forgot-password' && <label className="input-group">
                        <span className="auth-label-row"><span className="auth-field-label">Password</span>{isRegister && <small>At least 8 characters</small>}</span>
                        <div className="auth-input-wrap"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} autoComplete={isRegister ? 'new-password' : 'current-password'} /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
                        {isRegister && passwordScore && <small className="password-hint">{passwordScore}</small>}
                    </label>}
                    <button className="btn btn-primary auth-submit" disabled={loading}>{loading ? 'Please wait…' : isRegister ? 'Create account' : mode === 'forgot-password' ? 'Send reset link' : mode === 'reset-password' ? 'Reset password' : 'Sign in'} <ArrowRight size={17} /></button>
                </form>
                <button className="auth-switch" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                    {isRegister ? <>Already have an account? <strong>Sign in</strong></> : <>New to Quick Mail? <strong>Create an account</strong></>}
                </button>
                {mode === 'login' && <button className="auth-switch" onClick={() => setMode('forgot-password')}>Forgot your password?</button>}
                </div>
            </section>
        </main>
    );
};

export default AuthPage;
