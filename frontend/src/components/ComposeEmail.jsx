import React, { useState } from 'react';
import { Send, User, Type, FileCode, PenTool, Paperclip, X } from 'lucide-react';

const ComposeEmail = ({ formData, handleChange, handleSubmit, loading, handleFileChange, removeAttachment }) => {
    const [showHtml, setShowHtml] = useState(false);

    return (
        <div className="compose-wrapper fade-in">
            <div className="compose-paper">
                <div className="compose-header">
                    <h2>New Message</h2>
                    <div className="window-controls">
                        <span className="control-dot close"></span>
                        <span className="control-dot minimize"></span>
                        <span className="control-dot expand"></span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="compose-form">
                    <div className="input-group">
                        <label htmlFor="to">To</label>
                        <input
                            type="email"
                            id="to"
                            name="to"
                            value={formData.to}
                            onChange={handleChange}
                            required
                            placeholder="recipient@example.com"
                            className="clean-input"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="subject">Subject</label>
                        <input
                            type="text"
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            placeholder="What's this about?"
                            className="clean-input subject-input"
                        />
                    </div>

                    <div className="editor-area">
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            placeholder="Write your story..."
                            className="clean-textarea"
                        />
                    </div>

                    {formData.attachments && formData.attachments.length > 0 && (
                        <div className="attachments-preview-area">
                            <div className="attachments-header">
                                <span className="paperclip-icon"><Paperclip size={14} /></span>
                                <span>{formData.attachments.length} file{formData.attachments.length !== 1 ? 's' : ''} attached</span>
                            </div>
                            <div className="attachments-grid">
                                {formData.attachments.map((file, index) => (
                                    <div key={index} className="attachment-card fade-in">
                                        <div className="attachment-icon">
                                            <FileCode size={20} />
                                        </div>
                                        <div className="attachment-info">
                                            <span className="attachment-name" title={file.name}>{file.name}</span>
                                            <span className="attachment-size">{(file.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="remove-attachment-btn"
                                            onClick={() => removeAttachment(index)}
                                            title="Remove file"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="html-toggle-section">
                        <button
                            type="button"
                            className={`toggle-btn ${showHtml ? 'active' : ''}`}
                            onClick={() => setShowHtml(!showHtml)}
                        >
                            <FileCode size={16} />
                            <span>{showHtml ? 'Hide HTML Editor' : 'Add HTML Content'}</span>
                        </button>

                        {showHtml && (
                            <textarea
                                name="html"
                                value={formData.html}
                                onChange={handleChange}
                                placeholder="<div>Enter your HTML code here...</div>"
                                className="code-textarea fade-in"
                            />
                        )}
                    </div>

                    <div className="compose-footer">
                        <div className="toolbar-left">
                            <div className="file-input-container">
                                <input
                                    type="file"
                                    id="file-upload"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden-file-input"
                                />
                                <label htmlFor="file-upload" className="attach-file-btn">
                                    <Paperclip size={18} />
                                    <span>Attach Files</span>
                                </label>
                            </div>

                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-send-primary"
                        >
                            {loading ? (
                                <>
                                    <div className="spinner-sm"></div>
                                    <span>Sending...</span>
                                </>
                            ) : (
                                <>
                                    <span>Send Message</span>
                                    <Send size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ComposeEmail;
