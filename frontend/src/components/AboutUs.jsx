import React from 'react';
import { Shield, Zap, Globe, Heart, Code, Github, Linkedin, Mail, ExternalLink, ArrowRight, Sparkles, Target, Users } from 'lucide-react';

const AboutUs = () => {
    return (
        <div className="about-modern fade-in">
            <div className="about-header-modern">
                <div className="brand-pill">
                    <Mail size={16} />
                    <span>Quick Mail v2.0</span>
                </div>
                <h1>Empowering Communication Through Code</h1>
                <p className="hero-subtitle">
                    Quick Mail is a modern email delivery platform built with passion for developers
                    who value reliability, security, and simplicity. Born from the need for a self-hosted,
                    transparent email solution with beautiful UI.
                </p>
            </div>

            <div className="mission-section glass-card">
                <div className="mission-content">
                    <div className="icon-box primary">
                        <Target size={28} />
                    </div>
                    <h2>Our Mission</h2>
                    <p>
                        To provide developers with a powerful, transparent, and easy-to-use email infrastructure
                        that puts control back in their hands. We believe in self-hosted solutions that respect
                        your privacy while delivering enterprise-grade features with a premium user experience.
                    </p>
                </div>
            </div>

            <div className="features-grid-modern">
                <div className="feature-card-modern">
                    <div className="icon-box success">
                        <Shield size={24} />
                    </div>
                    <h3>Production-Grade Security</h3>
                    <p>Enterprise-grade security with Helmet headers, CORS protection, rate limiting (10 emails/15min), and optional Ghost Mode for privacy.</p>
                </div>

                <div className="feature-card-modern">
                    <div className="icon-box info">
                        <Globe size={24} />
                    </div>
                    <h3>Open Source</h3>
                    <p>Fully transparent codebase on GitHub. Contribute, customize, and learn from a production-ready MERN application.</p>
                </div>

                <div className="feature-card-modern">
                    <div className="icon-box secondary">
                        <Code size={24} />
                    </div>
                    <h3>Flexible Deployment</h3>
                    <p>Deploy with Docker or PM2. Switch between local MongoDB and cloud Atlas. SSL-ready with comprehensive deployment guides.</p>
                </div>
            </div>

            <div className="story-section">
                <div className="section-header">
                    <h2>The Story Behind Quick Mail</h2>
                </div>
                <div className="story-content">
                    <p>
                        Quick Mail started as a personal project to explore the MERN stack while solving a real-world problem.
                        Many developers need reliable email delivery for their applications but don't want the complexity of
                        third-party services or the cost of cloud solutions.
                    </p>
                    <p>
                        What began as a simple SMTP wrapper evolved into a full-featured email platform with rich text editing,
                        real-time tracking, comprehensive analytics, and a UI that rivals commercial products. Every feature
                        was designed with the developer experience in mind.
                    </p>
                    <div className="story-highlights">
                        <div className="highlight-item">
                            <Sparkles size={20} className="highlight-icon" />
                            <span>Docker & PM2 deployment ready</span>
                        </div>
                        <div className="highlight-item">
                            <Zap size={20} className="highlight-icon" />
                            <span>Flexible MongoDB: local or cloud Atlas</span>
                        </div>
                        <div className="highlight-item">
                            <Users size={20} className="highlight-icon" />
                            <span>Production-tested with SSL support</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="connect-section">
                <h3>Connect With the Developer</h3>
                <div className="social-links-modern">
                    <a href="https://github.com/janak0ff" target="_blank" rel="noopener noreferrer" className="social-btn github">
                        <Github size={20} />
                        <span>GitHub</span>
                    </a>
                    <a href="https://www.linkedin.com/in/janakkss/" target="_blank" rel="noopener noreferrer" className="social-btn linkedin">
                        <Linkedin size={20} />
                        <span>LinkedIn</span>
                    </a>
                    <a href="https://www.janakkumarshrestha0.com.np" target="_blank" rel="noopener noreferrer" className="social-btn website">
                        <Globe size={20} />
                        <span>Portfolio</span>
                        <ExternalLink size={14} className="external-icon" />
                    </a>
                </div>
            </div>

            <div className="contribute-section">
                <div className="contribute-card">
                    <h3>Want to Contribute?</h3>
                    <p>Quick Mail is open source and welcomes contributions from the community. Whether it's bug fixes, new features, or documentation improvements - every contribution matters.</p>
                    <a href="https://github.com/janak0ff/MERN-gmail-smpt" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                        View on GitHub <ArrowRight size={18} />
                    </a>
                </div>
            </div>

            <div className="about-footer-modern">
                <p>
                    Built with <Heart size={16} className="heart-icon-anim" /> by <strong>Janak Shrestha</strong>
                </p>
                <p className="footer-tagline">
                    Making email delivery simple, secure, and beautiful
                </p>
            </div>
        </div>
    );
};

export default AboutUs;
