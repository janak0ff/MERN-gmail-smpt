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

                <div className="table-responsive">
                    {emails.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon-wrapper">
                                <Mail size={48} />
                            </div>
                            <h3>No emails found</h3>
                            <p>Try adjusting your filters or send a new email.</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Recipient</th>
                                    <th>Subject</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {emails.map((email) => (
                                    <tr key={email._id}>
                                        <td>
                                            <span className={`status-badge-pill ${email.status}`}>
                                                {getStatusIcon(email.status)}
                                                {email.status}
                                            </span>
                                        </td>
                                        <td className="font-medium">{email.to}</td>
                                        <td className="text-truncate" style={{ maxWidth: '200px' }}>
                                            {email.subject}
                                        </td>
                                        <td>
                                            {new Date(email.createdAt).toLocaleDateString()}
                                            <span className="time-sub">
                                                {new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn-icon" title="View Details">
                                                <Mail size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
