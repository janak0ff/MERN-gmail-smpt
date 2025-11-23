import React from 'react';
import { Mail, BarChart3, History, CheckCircle, XCircle, Clock } from 'lucide-react';
import StatCard from './StatCard';

const EmailStats = ({ stats }) => {
    if (!stats) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading analytics...</p>
            </div>
        );
    }

    return (
        <div className="stats-container fade-in">
            <div className="section-header">
                <h2>Analytics Overview</h2>
                <p className="text-muted">Real-time performance metrics</p>
            </div>

            <div className="stats-grid">
                <StatCard
                    icon={Mail}
                    label="Total Emails"
                    value={stats.total}
                    className="card-blue"
                />
                <StatCard
                    icon={BarChart3}
                    label="Sent Today"
                    value={stats.today}
                    className="card-purple"
                />
                <StatCard
                    icon={History}
                    label="Last 7 Days"
                    value={stats.last7Days}
                    className="card-indigo"
                />
            </div>

            <div className="stats-row">
                <div className="card flex-1">
                    <div className="card-header">
                        <h3>Delivery Status</h3>
                    </div>
                    <div className="status-breakdown">
                        <div className="status-item success">
                            <div className="status-icon-bg">
                                <CheckCircle size={24} />
                            </div>
                            <div className="status-details">
                                <span className="status-count">{stats.byStatus?.sent || 0}</span>
                                <span className="status-label">Delivered</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill success"
                                    style={{ width: `${(stats.byStatus?.sent / stats.total * 100) || 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="status-item danger">
                            <div className="status-icon-bg">
                                <XCircle size={24} />
                            </div>
                            <div className="status-details">
                                <span className="status-count">{stats.byStatus?.failed || 0}</span>
                                <span className="status-label">Failed</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill danger"
                                    style={{ width: `${(stats.byStatus?.failed / stats.total * 100) || 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="status-item warning">
                            <div className="status-icon-bg">
                                <Clock size={24} />
                            </div>
                            <div className="status-details">
                                <span className="status-count">{stats.byStatus?.pending || 0}</span>
                                <span className="status-label">Pending</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill warning"
                                    style={{ width: `${(stats.byStatus?.pending / stats.total * 100) || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailStats;
