import React, { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api';

const ChangePassword = () => {
  const [form, setForm] = useState({ currentPassword: '', password: '' });
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/change-password', form);
      setForm({ currentPassword: '', password: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to change password');
    } finally {
      setLoading(false);
    }
  };
  return <section className="auth-card" style={{ margin: '3rem auto' }}>
    <h2>Change password</h2>
    <form className="auth-form" onSubmit={submit}>
      <label className="input-group"><span className="auth-field-label">Current password</span><div className="auth-input-wrap"><LockKeyhole size={18} /><input type="password" required value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} /></div></label>
      <label className="input-group"><span className="auth-field-label">New password</span><div className="auth-input-wrap"><LockKeyhole size={18} /><input type="password" minLength={8} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div></label>
      <button className="btn btn-primary auth-submit" disabled={loading}>{loading ? 'Please wait…' : 'Change password'}</button>
    </form>
  </section>;
};

export default ChangePassword;
