import React from 'react';
import { Send, Shield, Zap, CheckCircle, ArrowRight, Globe, BarChart3, Lock, Mail, Code, Database, FileText, Users, Smartphone, Briefcase, GraduationCap } from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
    return (
        <div className="landing-page fade-in">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="pulse-dot"></span>
                        <span>Quick Mail v1.0 - Production Ready</span>
                    </div>
                    <h1 className="hero-title">
                        Modern Email Infrastructure <br />
                        <span className="gradient-text">Built for Developers</span>
                    </h1>
                    <p className="hero-subtitle">
                        Professional SMTP email delivery with rich text editing, real-time tracking,
                        and comprehensive analytics. Self-hosted, secure, and always reliable.
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
                            <span className="metric-value">Real-time</span>
                            <span className="metric-label">Delivery Tracking</span>
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
                        <h3>Marketing Campaigns</h3>
                        <p>Send newsletters and promotional content with rich formatting and attachment support.</p>
                    </div>

                    <div className="use-case-card">
                        <div className="use-case-icon green">
                            <Users size={24} />
                        </div>
                        <h3>Customer Communication</h3>
                        <p>Professional email delivery for support tickets, announcements, and updates.</p>
                    </div>

                    <div className="use-case-card">
                        <div className="use-case-icon orange">
                            <GraduationCap size={24} />
                        </div>
                        <h3>Learning & Development</h3>
                        <p>Perfect for exploring MERN stack with a production-ready, modern application.</p>
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
                        <h3>Email Validation</h3>
                        <p>Deep validation with MX checks, typo detection, and disposable email filtering for reliable delivery.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon green">
                            <BarChart3 size={28} />
                        </div>
                        <h3>Real-time Analytics</h3>
                        <p>Track delivery rates, monitor performance, and view detailed statistics with visual charts.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon orange">
                            <Globe size={28} />
                        </div>
                        <h3>Email History</h3>
                        <p>Complete tracking with advanced filtering by status, recipient, and date range. Full audit trail.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon indigo">
                            <Lock size={28} />
                        </div>
                        <h3>Secure & Reliable</h3>
                        <p>Rate limiting, Gmail OAuth2 support, and comprehensive error handling for production use.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon teal">
                            <Smartphone size={28} />
                        </div>
                        <h3>Fully Responsive</h3>
                        <p>Optimized for mobile, tablet, and desktop with dark mode and glassmorphism design.</p>
                    </div>
                </div>
            </section>

            {/* Tech Stack Section */}
            <section className="tech-stack-section">
                <div className="section-header">
                    <h2>Built with Modern Technologies</h2>
                    <p>Industry-standard MERN stack with premium UI/UX</p>
                </div>

                <div className="tech-stack-grid">
                    <div className="tech-item">
                        <div className="tech-icon">
                            <Database size={32} />
                        </div>
                        <h4>MongoDB</h4>
                        <p>Atlas or local database with retry logic</p>
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
                        <p>Nodemailer with Gmail SMTP</p>
                    </div>
                </div>

                <div className="tech-features">
                    <div className="tech-feature-item">
                        <CheckCircle size={18} />
                        <span>Docker ready for instant deployment</span>
                    </div>
                    <div className="tech-feature-item">
                        <CheckCircle size={18} />
                        <span>TypeScript compatible architecture</span>
                    </div>
                    <div className="tech-feature-item">
                        <CheckCircle size={18} />
                        <span>Production-tested and battle-ready</span>
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
        </div>
    );
};

export default LandingPage;
