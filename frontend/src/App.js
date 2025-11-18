import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { Send, History, BarChart3, Mail, CheckCircle, XCircle, Clock } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: '',
    html: ''
  });
  const [loading, setLoading] = useState(false);
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
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/email/stats/summary`);
      if (response.data.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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
    <div className="App">
      <div className="container">
        <header className="app-header">
          <div className="header-content">
            <Mail size={32} className="header-icon" />
            <div>
              <h1>MERN SMTP Email App</h1>
              <p>Send emails through Gmail SMTP with complete history tracking</p>
            </div>
          </div>
          <button 
            onClick={checkSMTPHealth} 
            className="btn btn-info health-btn"
          >
            Check SMTP Health
          </button>
        </header>

        <nav className="tabs">
          <button 
            className={`tab ${activeTab === 'compose' ? 'active' : ''}`}
            onClick={() => setActiveTab('compose')}
          >
            <Send size={18} />
            Compose Email
          </button>
          <button 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            Email History
          </button>
          <button 
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <BarChart3 size={18} />
            Statistics
          </button>
        </nav>

        <main className="main-content">
          {activeTab === 'compose' && (
            <div className="compose-section">
              <form onSubmit={handleSubmit} className="email-form">
                <div className="form-group">
                  <label htmlFor="to">To:</label>
                  <input
                    type="email"
                    id="to"
                    name="to"
                    value={formData.to}
                    onChange={handleChange}
                    required
                    placeholder="recipient@example.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject:</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Email subject"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message:</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Type your message here..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="html">HTML Content (optional):</label>
                  <textarea
                    id="html"
                    name="html"
                    value={formData.html}
                    onChange={handleChange}
                    rows="4"
                    placeholder="HTML content (will override plain text message)"
                  />
                  <small>If provided, this will be used instead of the plain text message</small>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-primary send-btn"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Email
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-section">
              <div className="section-header">
                <h2>Email History</h2>
                <div className="header-actions">
                  <button 
                    onClick={clearFilters}
                    className="btn btn-outline"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="filters">
                <div className="filter-group">
                  <label>Status:</label>
                  <select name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="">All Status</option>
                    <option value="sent">Sent</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Recipient:</label>
                  <input
                    type="text"
                    name="recipient"
                    value={filters.recipient}
                    onChange={handleFilterChange}
                    placeholder="Filter by recipient"
                  />
                </div>

                <div className="filter-group">
                  <label>From Date:</label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                  />
                </div>

                <div className="filter-group">
                  <label>To Date:</label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>

              {/* Email List */}
              {emails.length === 0 ? (
                <div className="no-emails">
                  <Mail size={48} />
                  <p>No emails found matching your criteria.</p>
                </div>
              ) : (
                <>
                  <div className="email-list">
                    {emails.map((email) => (
                      <div key={email._id} className="email-item">
                        <div className="email-header">
                          <div className="email-info">
                            <div className="email-to">
                              <strong>To: {email.to}</strong>
                              {getStatusIcon(email.status)}
                            </div>
                            <div className="email-subject">{email.subject}</div>
                          </div>
                          <span className={`status-badge ${email.status}`}>
                            {email.status}
                          </span>
                        </div>
                        <div className="email-preview">
                          {email.message.substring(0, 150)}...
                        </div>
                        <div className="email-meta">
                          <span>Created: {new Date(email.createdAt).toLocaleString()}</span>
                          {email.sentAt && (
                            <span>Sent: {new Date(email.sentAt).toLocaleString()}</span>
                          )}
                          {email.attempts > 0 && (
                            <span>Attempts: {email.attempts}</span>
                          )}
                        </div>
                        {email.error && (
                          <div className="email-error">
                            <strong>Error:</strong> {email.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="pagination">
                      <button
                        disabled={filters.page === 1}
                        onClick={() => handlePageChange(filters.page - 1)}
                        className="btn btn-outline"
                      >
                        Previous
                      </button>
                      
                      <span className="page-info">
                        Page {filters.page} of {pagination.totalPages}
                        ({pagination.total} total emails)
                      </span>
                      
                      <button
                        disabled={filters.page === pagination.totalPages}
                        onClick={() => handlePageChange(filters.page + 1)}
                        className="btn btn-outline"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="stats-section">
              <h2>Email Statistics</h2>
              {stats ? (
                <div className="stats-grid">
                  <div className="stat-card total">
                    <div className="stat-icon">
                      <Mail size={24} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-number">{stats.total}</div>
                      <div className="stat-label">Total Emails</div>
                    </div>
                  </div>

                  <div className="stat-card today">
                    <div className="stat-icon">
                      <BarChart3 size={24} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-number">{stats.today}</div>
                      <div className="stat-label">Today</div>
                    </div>
                  </div>

                  <div className="stat-card week">
                    <div className="stat-icon">
                      <History size={24} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-number">{stats.last7Days}</div>
                      <div className="stat-label">Last 7 Days</div>
                    </div>
                  </div>

                  <div className="stat-card sent">
                    <div className="stat-icon">
                      <CheckCircle size={24} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-number">{stats.byStatus?.sent || 0}</div>
                      <div className="stat-label">Sent</div>
                    </div>
                  </div>

                  <div className="stat-card failed">
                    <div className="stat-icon">
                      <XCircle size={24} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-number">{stats.byStatus?.failed || 0}</div>
                      <div className="stat-label">Failed</div>
                    </div>
                  </div>

                  <div className="stat-card pending">
                    <div className="stat-icon">
                      <Clock size={24} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-number">{stats.byStatus?.pending || 0}</div>
                      <div className="stat-label">Pending</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="loading-stats">Loading statistics...</div>
              )}
            </div>
          )}
        </main>
      </div>
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
      />
    </div>
  );
}

export default App;