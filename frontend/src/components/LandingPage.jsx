import React from 'react';
import { Send, Shield, Zap, CheckCircle, ArrowRight, Globe, BarChart3, Lock } from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
    return (
        <div className="landing-page fade-in">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="pulse-dot"></span>
                        <span>v2.0 Now Available</span>
                    </div>
                    <h1 className="hero-title">
                        Email Infrastructure <br />
                        <span className="gradient-text">Reimagined for Developers</span>
                    </h1>
                    <p className="hero-subtitle">
                        The most reliable, secure, and developer-friendly SMTP solution.
                        Send transactional emails with confidence and track performance in real-time.
                    </p>
                    <div className="hero-cta-group">
                        <button onClick={onGetStarted} className="btn btn-primary btn-xl">
                            Start Sending <ArrowRight size={20} />
                        </button>
                        <button className="btn btn-glass btn-xl">
                            View Documentation
                        </button>
                    </div>

                    <div className="hero-metrics">
                        <div className="metric-item">
                            <span className="metric-value">99.99%</span>
                            <span className="metric-label">Uptime Guarantee</span>
                        </div>
                        <div className="metric-divider"></div>
                        <div className="metric-item">
                            <span className="metric-value">&lt;50ms</span>
                            <span className="metric-label">Global Latency</span>
                        </div>
                        <div className="metric-divider"></div>
                        <div className="metric-item">
                            <span className="metric-value">10k+</span>
                            <span className="metric-label">Daily Emails</span>
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
                            <div className="code-line indent">  subject: <span className="string">'Welcome aboard!'</span>,</div>
                            <div className="code-line indent">  template: <span className="string">'onboarding_v1'</span></div>
                            <div className="code-line">{'}'});</div>
                            <div className="code-line success-log">
                                <CheckCircle size={14} /> <span>Email sent successfully! id: 8f92a...</span>
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
                                <span className="value">0.04s</span>
                            </div>
                        </div>
                    </div>
                    <div className="glow-effect"></div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <div className="section-header">
                    <h2>Everything you need to send emails</h2>
                    <p>Powerful features built for modern applications</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon blue">
                            <Send size={28} />
                        </div>
                        <h3>Smart Delivery</h3>
                        <p>Intelligent routing algorithms ensure your emails land in the inbox, not the spam folder.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon purple">
                            <Shield size={28} />
                        </div>
                        <h3>Bank-Grade Security</h3>
                        <p>End-to-end encryption, SPF/DKIM support, and OAuth2 authentication protect your data.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon green">
                            <BarChart3 size={28} />
                        </div>
                        <h3>Real-time Analytics</h3>
                        <p>Track open rates, click-throughs, and delivery status in real-time with detailed logs.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon orange">
                            <Globe size={28} />
                        </div>
                        <h3>Global Infrastructure</h3>
                        <p>Distributed edge network ensures low latency delivery from anywhere in the world.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
