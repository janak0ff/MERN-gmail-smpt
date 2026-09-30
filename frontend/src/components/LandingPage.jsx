import React from 'react';
import { Send, Shield, Zap, CheckCircle, ArrowRight, Globe, BarChart3, Lock, Mail, Code, Database, FileText, Users, Smartphone, Briefcase, GraduationCap, Heart, Clock } from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
    return (
        <div className="landing-page fade-in">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="pulse-dot"></span>
                        <span>Quick Mail - Production-ready email workspace</span>
                    </div>
                    <h1 className="hero-title">
                        Modern Email Infrastructure <br />
                        <span className="gradient-text">Built for Developers</span>
                    </h1>
                    <p className="hero-subtitle">
                        A secure email workspace for composing, scheduling, and tracking messages
                        through your own SMTP infrastructure. Self-hosted, responsive, and built for
                        reliable day-to-day delivery.
                    </p>
                    <div className="hero-cta-group">
                        <button onClick={onGetStarted} className="btn btn-primary btn-xl">
                            Start Sending <ArrowRight size={20} />
                        </button>
                        <a href="https://github.com/janak0ff/MERN-gmail-smpt" target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-xl">
                            View Documentation
                        </a>
                    </div>

                    <div className="hero-metrics">
                        <div className="metric-item">
                            <span className="metric-value">Rich Text</span>
                            <span className="metric-label">Editor Built-in</span>
                        </div>
                        <div className="metric-divider"></div>
                        <div className="metric-item">
                            <span className="metric-value">10MB</span>
                            <span className="metric-label">Attachment Support</span>
                        </div>
                        <div className="metric-divider"></div>
                        <div className="metric-item">
                            <span className="metric-value">Queue-backed</span>
                            <span className="metric-label">Scheduled Delivery</span>
                        </div>
                    </div>
                </div>

                <div className="hero-visual-container">
                    <div className="glass-card main-visual">
                        <div className="window-controls">
                            <span className="control red"></span>
                            <span className="control yellow"></span>
                            <span className="control green"></span>
                        </div>
                        <div className="code-preview">
                            <div className="code-line"><span className="keyword">const</span> <span className="variable">email</span> = <span className="keyword">await</span> <span className="function">sendEmail</span>({'{'}</div>
                            <div className="code-line indent">  to: <span className="string">'user@example.com'</span>,</div>
                            <div className="code-line indent">  subject: <span className="string">'Welcome to Quick Mail!'</span>,</div>
                            <div className="code-line indent">  html: <span className="string">'&lt;h1&gt;Hello!&lt;/h1&gt;'</span></div>
                            <div className="code-line">{'}'});</div>
                            <div className="code-line success-log">
                                <CheckCircle size={14} /> <span>✓ Email delivered successfully!</span>
                            </div>
                        </div>

                        <div className="floating-badge badge-1">
                            <div className="icon-box success">
                                <CheckCircle size={20} />
                            </div>
                            <div className="badge-text">
                                <span className="label">Status</span>
                                <span className="value">Delivered</span>
                            </div>
                        </div>

                        <div className="floating-badge badge-2">
                            <div className="icon-box warning">
                                <Zap size={20} />
                            </div>
                            <div className="badge-text">
                                <span className="label">Speed</span>
                                <span className="value">Instant</span>
                            </div>
                        </div>
                    </div>
                    <div className="glow-effect"></div>
                </div>
            </section>

            {/* Use Cases Section */}
            <section className="use-cases-section">
                <div className="section-header">
                    <h2>Perfect for Every Use Case</h2>
                    <p>From transactional emails to marketing campaigns, Quick Mail has you covered</p>
                </div>

                <div className="use-cases-grid">
                    <div className="use-case-card">
                        <div className="use-case-icon purple">
                            <Briefcase size={24} />
                        </div>
                        <h3>Transactional Emails</h3>
                        <p>Order confirmations, password resets, and automated notifications with guaranteed delivery.</p>
                    </div>

                    <div className="use-case-card">
                        <div className="use-case-icon blue">
                            <Mail size={24} />
                        </div>
                        <h3>Team Communication</h3>
                        <p>Prepare announcements and updates with reusable templates, attachments, and a dependable delivery queue.</p>
                    </div>

                    <div className="use-case-card">
                        <div className="use-case-icon green">
                            <Users size={24} />
                        </div>
                        <h3>Transactional Workflows</h3>
                        <p>Send account notifications, support replies, and operational messages from a protected workspace.</p>
                    </div>

                    <div className="use-case-card">
                        <div className="use-case-icon orange">
                            <GraduationCap size={24} />
                        </div>
                        <h3>Developer Platform</h3>
                        <p>Explore a production-oriented MERN application with Docker, Redis, BullMQ, and automated delivery.</p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-header">
                    <h2>Everything You Need to Send Emails</h2>
                    <p>Powerful features built for modern applications</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon blue">
                            <FileText size={28} />
                        </div>
                        <h3>Rich Text Editor</h3>
                        <p>Format emails with bold, italic, underline, lists, and text alignment. Built-in editor with live preview.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon purple">
                            <Shield size={28} />
                        </div>
                        <h3>Reliable Delivery Queue</h3>
                        <p>Queue scheduled messages with Redis and BullMQ, retry transient failures, and track delivery status in your history.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon indigo">
                            <Lock size={28} />
                        </div>
                        <h3>Account Security</h3>
                        <p>Use protected sessions, password hashing, verification and reset flows, rate limiting, and user-scoped email data.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon green">
                            <BarChart3 size={28} />
                        </div>
                        <h3>Delivery Analytics</h3>
                        <p>Review delivery totals and status trends with searchable, paginated history and export support.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon orange">
                            <Globe size={28} />
                        </div>
                        <h3>Drafts & Templates</h3>
                        <p>Autosave work in progress and reuse message templates to compose consistent emails faster.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon teal">
                            <Shield size={28} />
                        </div>
                        <h3>Production Operations</h3>
                        <p>Run non-root containers behind Nginx with security headers, upload limits, health checks, and graceful shutdown.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon teal">
                            <Smartphone size={28} />
                        </div>
                        <h3>Fully Responsive</h3>
                        <p>Optimized for mobile, tablet, and desktop with dark mode and glassmorphism design.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon indigo">
                            <Clock size={28} />
                        </div>
                        <h3>Schedule with Confidence</h3>
                        <p>Schedule messages for later, cancel pending jobs, and let the worker process retries independently from the API.</p>
                    </div>
                </div>
            </section>

            {/* Tech Stack Section */}
            <section className="tech-stack-section">
                <div className="section-header">
                    <h2>Built with Modern Technologies</h2>
                    <p>A maintainable stack with local development and production deployment paths</p>
                </div>

                <div className="tech-stack-grid">
                    <div className="tech-item">
                        <div className="tech-icon">
                            <Database size={32} />
                        </div>
                        <h4>MongoDB</h4>
                        <p>Flexible: Atlas cloud or local database</p>
                    </div>

                    <div className="tech-item">
                        <div className="tech-icon">
                            <Send size={32} />
                        </div>
                        <h4>Express.js</h4>
                        <p>RESTful API with security middleware</p>
                    </div>

                    <div className="tech-item">
                        <div className="tech-icon">
                            <Code size={32} />
                        </div>
                        <h4>React 19</h4>
                        <p>Modern UI with Vite and HMR</p>
                    </div>

                    <div className="tech-item">
                        <div className="tech-icon">
                            <Zap size={32} />
                        </div>
                        <h4>Node.js</h4>
                        <p>Nodemailer, Redis, and BullMQ worker</p>
                    </div>
                </div>

                <div className="tech-features">
                    <div className="tech-feature-item">
                        <CheckCircle size={18} />
                        <span>Docker, PM2, and host Nginx deployment options</span>
                    </div>
                    <div className="tech-feature-item">
                        <CheckCircle size={18} />
                        <span>Local or cloud MongoDB support</span>
                    </div>
                    <div className="tech-feature-item">
                        <CheckCircle size={18} />
                        <span>GitHub Actions CI/CD with GHCR image delivery</span>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Start Sending?</h2>
                    <p>Get up and running in minutes with our comprehensive documentation</p>
                    <div className="cta-buttons">
                        <button onClick={onGetStarted} className="btn btn-primary btn-xl">
                            Compose Your First Email <ArrowRight size={20} />
                        </button>
                        <a href="https://github.com/janak0ff/MERN-gmail-smpt" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-xl">
                            View on GitHub
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p>
                    Built with <Heart size={16} className="heart-icon" /> by <strong>Janak Shrestha</strong>
                </p>
                <p className="footer-tagline">
                    Making email delivery simple, secure, and beautiful
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;
