import React from 'react';
import { Mail, Send, XCircle, Clock, TrendingUp, BarChart3, Calendar } from 'lucide-react';

const EmailStats = ({ stats }) => {
    if (!stats) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading analytics...</p>
            </div>
        );
    }

    // Calculate success rate
    const successRate = stats.total > 0
        ? Math.round((stats.byStatus?.sent / stats.total) * 100)
        : 0;

    return (
        <div className="analytics-wrapper fade-in">
            <div className="analytics-header">
                <div className="header-content">
                    <h2>Analytics Overview</h2>
                    <p>Real-time performance metrics</p>
                </div>
                <div className="date-badge">
                    <Calendar size={14} />
                    <span>Today: {new Date().toLocaleDateString()}</span>
                </div>
            </div>

            <div className="kpi-grid">
                {/* Total Emails Card */}
                <div className="kpi-card total">
                    <div className="kpi-icon-wrapper">
                        <Mail size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Total Emails</span>
                        <h3 className="kpi-value">{stats.total}</h3>
                    </div>
                    <div className="kpi-trend">
                        <TrendingUp size={16} />
                        <span>All time</span>
                    </div>
                </div>

                {/* Sent Card */}
                <div className="kpi-card success">
                    <div className="kpi-icon-wrapper">
                        <Send size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Delivered</span>
                        <h3 className="kpi-value">{stats.byStatus?.sent || 0}</h3>
                    </div>
                    <div className="kpi-trend">
                        <span className="trend-value">{successRate}%</span>
                        <span>Success Rate</span>
                    </div>
                </div>

                {/* Failed Card */}
                <div className="kpi-card danger">
                    <div className="kpi-icon-wrapper">
                        <XCircle size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Failed</span>
                        <h3 className="kpi-value">{stats.byStatus?.failed || 0}</h3>
                    </div>
                </div>

                {/* Pending Card */}
                <div className="kpi-card warning">
                    <div className="kpi-icon-wrapper">
                        <Clock size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Pending</span>
                        <h3 className="kpi-value">{stats.byStatus?.pending || 0}</h3>
                    </div>
                </div>
            </div>

            <div className="charts-section">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Delivery Performance</h3>
                        <BarChart3 size={20} className="text-secondary" />
                    </div>
                    <div className="status-bars-vertical">
                        <div className="v-bar-group">
                            <div className="v-bar-track">
                                <div
                                    className="v-bar-fill success"
                                    style={{ height: `${(stats.byStatus?.sent / stats.total * 100) || 0}%` }}
                                ></div>
                            </div>
                            <span className="v-bar-label">Sent</span>
                            <span className="v-bar-value">{stats.byStatus?.sent || 0}</span>
                        </div>

                        <div className="v-bar-group">
                            <div className="v-bar-track">
                                <div
                                    className="v-bar-fill danger"
                                    style={{ height: `${(stats.byStatus?.failed / stats.total * 100) || 0}%` }}
                                ></div>
                            </div>
                            <span className="v-bar-label">Failed</span>
                            <span className="v-bar-value">{stats.byStatus?.failed || 0}</span>
                        </div>

                        <div className="v-bar-group">
                            <div className="v-bar-track">
                                <div
                                    className="v-bar-fill warning"
                                    style={{ height: `${(stats.byStatus?.pending / stats.total * 100) || 0}%` }}
                                ></div>
                            </div>
                            <span className="v-bar-label">Pending</span>
                            <span className="v-bar-value">{stats.byStatus?.pending || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailStats;
