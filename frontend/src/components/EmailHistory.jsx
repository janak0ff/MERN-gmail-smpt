import React from 'react';
import { Mail, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Search, Calendar } from 'lucide-react';

const EmailHistory = ({
    emails,
    filters,
    handleFilterChange,
    clearFilters,
    pagination,
    handlePageChange,
    getStatusIcon
}) => {
    return (
        <div className="history-container fade-in">
            <div className="card">
                <div className="card-header flex-between">
                    <h2>Email History</h2>
                    <button onClick={clearFilters} className="btn btn-text">
                        Reset Filters
                    </button>
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
                            <div className="history-header">
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
                                            <span className="cell-text text-truncate">{email.subject}</span>
                                        </div>
                                        <div className="h-col date" data-label="Date">
                                            <div className="date-wrapper">
                                                <span className="date-text">{new Date(email.createdAt).toLocaleDateString()}</span>
                                                <span className="time-sub">{new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        <div className="h-col actions" data-label="Actions">
                                            <button className="btn-icon-glass" title="View Details">
                                                <Mail size={16} />
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
                        <span className="pagination-info">
                            Showing page <strong>{filters.page}</strong> of <strong>{pagination.totalPages}</strong>
                        </span>
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
                                // Logic to show a window of pages around current page
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailHistory;
