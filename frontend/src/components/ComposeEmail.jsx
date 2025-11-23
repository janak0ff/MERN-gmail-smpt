import React from 'react';
import { Send } from 'lucide-react';

const ComposeEmail = ({ formData, handleChange, handleSubmit, loading }) => {
    return (
        <div className="compose-container fade-in">
            <div className="card compose-card">
                <div className="card-header">
                    <h2>New Message</h2>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit} className="email-form">
                        <div className="form-group">
                            <label htmlFor="to">To</label>
                            <input
                                type="email"
                                id="to"
                                name="to"
                                value={formData.to}
                                onChange={handleChange}
                                required
                                placeholder="recipient@example.com"
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="subject">Subject</label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                placeholder="What is this email about?"
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows="8"
                                placeholder="Write your message here..."
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="html">
                                HTML Content <span className="optional-badge">Optional</span>
                            </label>
                            <textarea
                                id="html"
                                name="html"
                                value={formData.html}
                                onChange={handleChange}
                                rows="4"
                                placeholder="<div>HTML content overrides plain text</div>"
                                className="form-control code-font"
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary send-btn"
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner-sm"></div>
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        <span>Send Email</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ComposeEmail;
