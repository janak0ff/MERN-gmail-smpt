import React, { useState } from 'react';
import { Mail, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Search, Calendar, RotateCcw, Paperclip, X, FileCode, Eye, Ghost } from 'lucide-react';

const EmailHistory = ({
    emails,
    filters,
    handleFilterChange,
    clearFilters,
    pagination,
    handlePageChange,
    getStatusIcon
}) => {
    const [selectedEmail, setSelectedEmail] = useState(null);

    const openEmailDetails = (email) => {
        setSelectedEmail(email);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    const closeEmailDetails = () => {
        setSelectedEmail(null);
        document.body.style.overflow = 'auto';
    };

    return (
        <div className="history-container fade-in">
            <div className="card">
                <div className="card-header flex-between">
                    <div className="header-content">
                        <h2>Email History</h2>
                        <p>Track and manage your email logs</p>
                    </div>
                </div>

                <div className="filters-bar">
                    <div className="filter-item search-filter">
                        <Search size={18} className="filter-icon" />
                        <input
                            type="text"
                            name="recipient"
                            value={filters.recipient}
                            onChange={handleFilterChange}
                            placeholder="Search recipients..."
                            className="filter-input"
                        />
                    </div>

                    <div className="filter-item">
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="filter-select"
                        >
                            <option value="">All Status</option>
                            <option value="sent">Sent</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    <div className="filter-item date-filter">
                        <Calendar size={18} className="filter-icon" />
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="filter-input"
                        />
                    </div>

                    <div className="filter-item date-filter">
                        <Calendar size={18} className="filter-icon" />
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="filter-input"
                        />
                    </div>
                    <div className="filter-item">
                        <button onClick={clearFilters} className="btn-reset-pill" title="Reset Filters">
                            <RotateCcw size={16} />
                            <span>Reset</span>
                        </button>
                    </div>
                </div>

                <div className="history-grid-container">
                    {emails.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon-wrapper">
                                <Mail size={48} />
                            </div>
                            <h3>No emails found</h3>
                            <p>Try adjusting your filters or send a new email.</p>
                        </div>
                    ) : (
                        <div className="history-grid">
                            {/* Header Row - Hidden on Mobile */}
                            <div className="history-header-row">
                                <div className="h-col status">Status</div>
                                <div className="h-col recipient">Recipient</div>
                                <div className="h-col subject">Subject</div>
                                <div className="h-col date">Date</div>
                                <div className="h-col actions">Actions</div>
                            </div>

                            {/* Data Rows */}
                            <div className="history-body">
                                {emails.map((email) => (
                                    <div key={email._id} className="history-row fade-in-up">
                                        <div className="h-col status" data-label="Status">
                                            <span className={`status-badge-pill ${email.status}`}>
                                                {getStatusIcon(email.status)}
                                                {email.status}
                                            </span>
                                        </div>
                                        <div className="h-col recipient" data-label="To">
                                            <span className="cell-text">{email.to}</span>
                                        </div>
                                        <div className="h-col subject" data-label="Subject">
                                            <div className="subject-wrapper">
                                                <span className="cell-text text-truncate">{email.subject}</span>
                                                {email.isGhost && (
                                                    <span className="ghost-indicator" title="Ghost Message (Local Only)">
                                                        <Ghost size={14} />
                                                    </span>
                                                )}
                                                {email.attachments && email.attachments.length > 0 && (
                                                    <span className="attachment-indicator" title={`${email.attachments.length} attachment(s)`}>
                                                        <Paperclip size={14} />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-col date" data-label="Date">
                                            <div className="date-wrapper">
                                                <span className="date-text">{new Date(email.createdAt).toLocaleDateString()}</span>
                                                <span className="time-sub">{new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        <div className="h-col actions" data-label="Actions">
                                            <button
                                                className="btn-icon-glass"
                                                title="View Details"
                                                onClick={() => openEmailDetails(email)}
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {pagination.totalPages > 1 && (
                    <div className="pagination-bar">
                        <div className="pagination-controls">
                            <button
                                disabled={filters.page === 1}
                                onClick={() => handlePageChange(filters.page - 1)}
                                className="btn-page"
                                aria-label="Previous Page"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {/* Page Numbers */}
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                let pageNum;
                                if (pagination.totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (filters.page <= 3) {
                                    pageNum = i + 1;
                                } else if (filters.page >= pagination.totalPages - 2) {
                                    pageNum = pagination.totalPages - 4 + i;
                                } else {
                                    pageNum = filters.page - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        className={`btn-page ${filters.page === pageNum ? 'active' : ''}`}
                                        onClick={() => handlePageChange(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                disabled={filters.page === pagination.totalPages}
                                onClick={() => handlePageChange(filters.page + 1)}
                                className="btn-page"
                                aria-label="Next Page"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                        <span className="pagination-info">
                            Showing page <strong>{filters.page}</strong> of <strong>{pagination.totalPages}</strong>
                        </span>
                    </div>
                )}
            </div>

            {/* Email Details Modal */}
            {selectedEmail && (
                <div className="modal-overlay fade-in" onClick={closeEmailDetails}>
                    <div className="modal-content slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Email Details</h3>
                            <button className="btn-close-modal" onClick={closeEmailDetails}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-group">
                                <label>Status</label>
                                <span className={`status-badge-pill ${selectedEmail.status}`}>
                                    {getStatusIcon(selectedEmail.status)}
                                    {selectedEmail.status}
                                </span>
                            </div>
                            <div className="detail-row">
                                <div className="detail-group">
                                    <label>To</label>
                                    <div className="detail-value">{selectedEmail.to}</div>
                                </div>
                                <div className="detail-group">
                                    <label>Date</label>
                                    <div className="detail-value">
                                        {new Date(selectedEmail.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <div className="detail-group">
                                <label>Subject</label>
                                <div className="detail-value subject">{selectedEmail.subject}</div>
                            </div>

                            <div className="detail-group">
                                <label>Message</label>
                                <div className="message-preview">
                                    {selectedEmail.message}
                                </div>
                            </div>

                            {selectedEmail.html && (
                                <div className="detail-group">
                                    <label>HTML Content</label>
                                    <div className="html-preview">
                                        <div className="code-badge">HTML</div>
                                        <pre>{selectedEmail.html}</pre>
                                    </div>
                                </div>
                            )}

                            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                                <div className="detail-group">
                                    <label>Attachments ({selectedEmail.attachments.length})</label>
                                    <div className="modal-attachments-grid">
                                        {selectedEmail.attachments.map((file, idx) => (
                                            <div key={idx} className="modal-attachment-card">
                                                <div className="file-icon-sm">
                                                    <FileCode size={16} />
                                                </div>
                                                <div className="file-info-sm">
                                                    <span className="file-name-sm" title={file.filename}>{file.filename}</span>
                                                    <span className="file-size-sm">{(file.size / 1024).toFixed(1)} KB</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedEmail.error && (
                                <div className="error-box">
                                    <strong>Error:</strong> {selectedEmail.error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailHistory;
