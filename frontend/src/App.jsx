import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import Layout from './components/Layout';
import ComposeEmail from './components/ComposeEmail';
import EmailHistory from './components/EmailHistory';
import EmailStats from './components/EmailStats';
import AboutUs from './components/AboutUs';
import { ThemeProvider } from './context/ThemeContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: '',
    html: ''
  });
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('compose');
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    recipient: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    if (activeTab === 'history') {
      fetchEmailHistory();
    }
    if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab, filters]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
      page: 1
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/email/send`, formData);

      if (response.data.success) {
        toast.success('Email sent successfully!');
        setFormData({ to: '', subject: '', message: '', html: '' });

        // Refresh stats if we're on history tab
        if (activeTab === 'history') {
          fetchStats();
        }
      } else {
        toast.error(`Failed to send email: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send email. Please try again.';
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

      const response = await axios.get(`${API_BASE_URL}/email/history?${params}`);
      if (response.data.success) {
        setEmails(response.data.emails);
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
      const response = await axios.get(`${API_BASE_URL}/email/stats/summary`);
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
      const response = await axios.get(`${API_BASE_URL}/email/health/check`);
      if (response.data.smtpConnected) {
        toast.success('✅ SMTP connection is healthy');
      } else {
        toast.error('❌ SMTP connection failed');
      }
    } catch (error) {
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
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10
    });
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

  return (
    <ThemeProvider>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCheckHealth={checkSMTPHealth}
      >
        {activeTab === 'compose' && (
          <ComposeEmail
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            loading={loading}
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
            onPageChange={handlePageChange}
            onRefresh={fetchEmailHistory}
            getStatusIcon={getStatusIcon}
          />
        )}

        {activeTab === 'stats' && (
          <EmailStats stats={stats} loading={statsLoading} />
        )}

        {activeTab === 'about' && (
          <AboutUs />
        )}
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