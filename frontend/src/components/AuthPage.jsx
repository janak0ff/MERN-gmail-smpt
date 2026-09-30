import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api';

const AuthPage = ({ onAuthenticated }) => {
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const response = await api.post(`/auth/${mode}`, form);
            localStorage.setItem('auth_token', response.data.token);
            onAuthenticated(response.data.user);
            toast.success(mode === 'login' ? 'Welcome back!' : 'Account created successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const isRegister = mode === 'register';
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
                        <span className="auth-kicker">{isRegister ? 'Get started' : 'Welcome back'}</span>
                        <h2>{isRegister ? 'Create your account' : 'Sign in to Quick Mail'}</h2>
                        <p>{isRegister ? 'Set up your secure email workspace in a few seconds.' : 'Continue to your email workspace.'}</p>
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
                    <label className="input-group">
                        <span className="auth-label-row"><span className="auth-field-label">Password</span>{isRegister && <small>At least 8 characters</small>}</span>
                        <div className="auth-input-wrap"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} autoComplete={isRegister ? 'new-password' : 'current-password'} /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
                        {isRegister && passwordScore && <small className="password-hint">{passwordScore}</small>}
                    </label>
                    <button className="btn btn-primary auth-submit" disabled={loading}>{loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={17} /></button>
                </form>
                <button className="auth-switch" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                    {isRegister ? <>Already have an account? <strong>Sign in</strong></> : <>New to Quick Mail? <strong>Create an account</strong></>}
                </button>
                </div>
            </section>
        </main>
    );
};

export default AuthPage;
