import React, { useEffect, useState } from 'react';
import { BookOpen, FileText, Trash2, Plus, Download } from 'lucide-react';
import api from '../api';
import { toast } from 'react-toastify';

const Workspace = ({ onLoadDraft, onApplyTemplate }) => {
    const [templates, setTemplates] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [form, setForm] = useState({ name: '', subject: '', message: '', html: '' });

    const load = async () => {
        try {
            const [templateResponse, draftResponse] = await Promise.all([
                api.get('/templates'),
                api.get('/drafts')
            ]);
            setTemplates(templateResponse.data.templates || []);
            setDrafts(draftResponse.data.drafts || []);
        } catch {
            toast.error('Unable to load templates and drafts');
        }
    };

    useEffect(() => {
        // Loading remote workspace data is an external synchronization.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, []);

    const createTemplate = async (event) => {
        event.preventDefault();
        try {
            await api.post('/templates', form);
            setForm({ name: '', subject: '', message: '', html: '' });
            await load();
            toast.success('Template saved');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to save template');
        }
    };

    const remove = async (type, id) => {
        if (!window.confirm(`Delete this ${type}?`)) return;
        try {
            await api.delete(`/${type === 'template' ? 'templates' : 'drafts'}/${id}`);
            await load();
        } catch {
            toast.error(`Unable to delete ${type}`);
        }
    };

    return (
        <div className="workspace-grid fade-in">
            <section className="card workspace-card">
                <div className="card-header">
                    <h2><BookOpen size={20} /> Templates</h2>
                    <p>Reusable, private message formats.</p>
                </div>
                <form className="workspace-form" onSubmit={createTemplate}>
                    <input className="clean-input" placeholder="Template name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    <input className="clean-input" placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                    <textarea className="clean-input workspace-textarea" placeholder="Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Save template</button>
                </form>
                <div className="workspace-list">
                    {templates.map(template => (
                        <div className="workspace-item" key={template._id}>
                            <div><strong>{template.name}</strong><small>{template.subject || 'No subject'}</small></div>
                            <div className="workspace-actions">
                                <button className="btn btn-secondary" onClick={() => onApplyTemplate(template)}>Use</button>
                                <button className="btn-icon-glass" title="Delete template" onClick={() => remove('template', template._id)}><Trash2 size={15} /></button>
                            </div>
                        </div>
                    ))}
                    {!templates.length && <p className="workspace-empty">No templates yet.</p>}
                </div>
            </section>
            <section className="card workspace-card">
                <div className="card-header">
                    <h2><FileText size={20} /> Drafts</h2>
                    <p>Compose is autosaved while you type.</p>
                </div>
                <div className="workspace-list">
                    {drafts.map(draft => (
                        <div className="workspace-item" key={draft._id}>
                            <div><strong>{draft.subject || 'Untitled draft'}</strong><small>{draft.to || 'No recipients'} · {new Date(draft.updatedAt).toLocaleString()}</small></div>
                            <div className="workspace-actions">
                                <button className="btn btn-secondary" onClick={() => onLoadDraft(draft)}><Download size={15} /> Open</button>
                                <button className="btn-icon-glass" title="Delete draft" onClick={() => remove('draft', draft._id)}><Trash2 size={15} /></button>
                            </div>
                        </div>
                    ))}
                    {!drafts.length && <p className="workspace-empty">No drafts yet.</p>}
                </div>
            </section>
        </div>
    );
};

export default Workspace;
