import React, { useState, useEffect } from 'react';
import api from './api';
import { ToastContainer, toast } from 'react-toastify';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import Layout from './components/Layout';
import ComposeEmail from './components/ComposeEmail';
import EmailHistory from './components/EmailHistory';
import EmailStats from './components/EmailStats';
import AboutUs from './components/AboutUs';
import LandingPage from './components/LandingPage';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage from './components/AuthPage';
import Workspace from './components/Workspace';
import ChangePassword from './components/ChangePassword';

function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: '',
    html: '',
    attachments: []
  });
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    recipient: '',
    q: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });
  const [draftId, setDraftId] = useState(null);
  const [autosaveState, setAutosaveState] = useState('');

  useEffect(() => {
    if (activeTab !== 'compose' || !Object.entries(formData).some(([key, value]) => key !== 'attachments' && value.trim())) return undefined;
    const timer = setTimeout(async () => {
      try {
        setAutosaveState('Saving…');
        const response = await api.post('/drafts/autosave', {
          to: formData.to,
          subject: formData.subject,
          message: formData.message,
          html: formData.html,
          draftId
        });
        setDraftId(response.data.draft._id);
        setAutosaveState('Saved');
      } catch {
        setAutosaveState('Save failed');
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [activeTab, formData, draftId]);

  useEffect(() => {
    api.get('/auth/me')
      .then(response => setUser(response.data.user))
      .catch(() => {})
      .finally(() => setAuthChecking(false));
  }, []);

  useEffect(() => {
    const handleAuthLogout = () => setUser(null);
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchEmailHistory();
    }
    if (activeTab === 'stats') {
      fetchStats();
    }
    // fetchEmailHistory is defined in this component and uses the current filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...files]
    });
  };

  const removeAttachment = (index) => {
    const newAttachments = [...formData.attachments];
    newAttachments.splice(index, 1);
    setFormData({
      ...formData,
      attachments: newAttachments
    });
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
      page: 1
    });
  };

  const handleSubmit = async (e, isGhostMode = false) => {
    e.preventDefault();

    // Frontend validation
    if (!formData.to || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields (To, Subject, Message)');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('to', formData.to);
      data.append('subject', formData.subject);
      data.append('message', formData.message);
      data.append('html', formData.html);
      data.append('ghostMode', isGhostMode);

      formData.attachments.forEach(file => {
        data.append('attachments', file);
      });

      const response = await api.post('/email/send', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success(isGhostMode ? 'Ghost message sent! (Saved locally)' : 'Email sent successfully!');

        // Handle Ghost Mode Local Storage
        if (isGhostMode) {
          const ghostEmail = {
            _id: `ghost-${Date.now()}`,
            to: formData.to,
            subject: formData.subject,
            message: formData.message,
            html: formData.html,
            status: 'sent',
            createdAt: new Date().toISOString(),
            isGhost: true,
            attachments: formData.attachments.map(f => ({
              filename: f.name,
              size: f.size
            }))
          };

          const existingGhosts = JSON.parse(localStorage.getItem('ghost_emails') || '[]');
          existingGhosts.push(ghostEmail);
          localStorage.setItem('ghost_emails', JSON.stringify(existingGhosts));
        }

        setFormData({ to: '', subject: '', message: '', html: '', attachments: [] });
        if (draftId) {
          api.delete(`/drafts/${draftId}`).catch(() => {});
          setDraftId(null);
        }

        // Refresh stats if we're on history tab
        if (activeTab === 'history') {
          fetchStats(); // Note: Stats won't reflect ghost emails on server
          fetchEmailHistory(); // Refresh list to show new ghost email
        }
      } else {
        toast.error(`Failed to send email: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      const serverError = error.response?.data?.error;
      const serverMessage = error.response?.data?.message;
      const errorMessage = serverError
        ? `${serverMessage}: ${serverError}`
        : (serverMessage || 'Failed to send email. Please try again.');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await api.get(`/email/history?${params}`);

      if (response.data.success) {
        let serverEmails = response.data.emails;

        // Fetch and process Ghost Emails
        const ghostEmails = JSON.parse(localStorage.getItem('ghost_emails') || '[]');
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // Filter expired ghost emails
        const validGhostEmails = ghostEmails.filter(email =>
          new Date(email.createdAt) > threeMonthsAgo
        );

        // Update storage if we filtered out expired ones
        if (validGhostEmails.length !== ghostEmails.length) {
          localStorage.setItem('ghost_emails', JSON.stringify(validGhostEmails));
        }

        // Apply client-side filtering for ghost emails (basic)
        const filteredGhostEmails = validGhostEmails.filter(email => {
          if (filters.recipient && !email.to.toLowerCase().includes(filters.recipient.toLowerCase())) return false;
          if (filters.status && email.status !== filters.status) return false;
          if (filters.startDate && new Date(email.createdAt) < new Date(filters.startDate)) return false;
          if (filters.endDate && new Date(email.createdAt) > new Date(filters.endDate)) return false;
          return true;
        });

        // Merge and Sort
        // Note: Pagination logic here is a bit tricky since we're mixing client/server data
        // For simplicity, we'll prepend ghost emails to the current page if it's page 1
        // A full solution would require client-side pagination of the merged list

        let combinedEmails = [...serverEmails];
        if (filters.page === 1) {
          combinedEmails = [...filteredGhostEmails, ...serverEmails];
          // Re-sort by date desc
          combinedEmails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        setEmails(combinedEmails);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching email history:', error);
      toast.error('Failed to fetch email history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await api.get('/email/stats/summary');
      if (response.data.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const checkSMTPHealth = async () => {
    try {
      const response = await api.get('/email/health/check');
      if (response.data.smtpConnected) {
        toast.success('✅ SMTP connection is healthy');
      } else {
        toast.error('❌ SMTP connection failed');
      }
    } catch {
      toast.error('❌ SMTP health check failed');
    }
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      recipient: '',
      q: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10
    });
  };

  const openDraft = (draft) => {
    setFormData({ to: draft.to || '', subject: draft.subject || '', message: draft.message || '', html: draft.html || '', attachments: [] });
    setDraftId(draft._id);
    setActiveTab('compose');
  };

  const applyTemplate = (template) => {
    setFormData(prev => ({ ...prev, subject: template.subject || prev.subject, message: template.message || '', html: template.html || '' }));
    setActiveTab('compose');
  };

  const exportHistory = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => { if (value && key !== 'page' && key !== 'limit') params.set(key, value); });
      const response = await api.get(`/email/history/export.csv?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'email-history.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Unable to export history'); }
  };

  const deleteEmail = async (email) => {
    if (email.isGhost || !window.confirm('Delete this history entry?')) return;
    try {
      await api.delete(`/email/history/${email._id}`);
      fetchEmailHistory();
      toast.success('History entry deleted');
    } catch { toast.error('Unable to delete history entry'); }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle size={16} className="status-icon sent" />;
      case 'failed':
        return <XCircle size={16} className="status-icon failed" />;
      default:
        return <Clock size={16} className="status-icon pending" />;
    }
  };

  if (authChecking) return null;
  if (!user) {
    return (
      <ThemeProvider>
        <AuthPage onAuthenticated={setUser} />
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </ThemeProvider>
    );
  }

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    setUser(null);
    setActiveTab('home');
  };

  return (
    <ThemeProvider>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCheckHealth={checkSMTPHealth}
        user={user}
        onLogout={handleLogout}
      >
        {activeTab === 'home' && (
          <LandingPage onGetStarted={() => setActiveTab('compose')} />
        )}

        {activeTab === 'compose' && (
          <ComposeEmail
            formData={formData}
            handleChange={handleChange}
            handleFileChange={handleFileChange}
            removeAttachment={removeAttachment}
            handleSubmit={handleSubmit}
            loading={loading}
            autosaveState={autosaveState}
          />
        )}

        {activeTab === 'history' && (
          <EmailHistory
            emails={emails}
            loading={historyLoading}
            filters={filters}
            handleFilterChange={handleFilterChange}
            clearFilters={clearFilters}
            pagination={pagination}
            handlePageChange={handlePageChange}
            onRefresh={fetchEmailHistory}
            getStatusIcon={getStatusIcon}
            onExport={exportHistory}
            onDelete={deleteEmail}
          />
        )}

        {activeTab === 'stats' && (
          <EmailStats stats={stats} loading={statsLoading} />
        )}

        {activeTab === 'library' && (
          <Workspace onLoadDraft={openDraft} onApplyTemplate={applyTemplate} />
        )}

        {activeTab === 'about' && (
          <AboutUs />
        )}
        {activeTab === 'security' && <ChangePassword />}
      </Layout>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </ThemeProvider>
  );
}

export default App;