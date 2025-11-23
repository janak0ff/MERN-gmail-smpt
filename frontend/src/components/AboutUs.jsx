import React from 'react';
import { Shield, Zap, Globe, Heart, Code, Github, Linkedin, Twitter } from 'lucide-react';

const AboutUs = () => {
    return (
        <div className="about-container fade-in">
            <div className="card about-card">
                <div className="about-header">
                    <div className="about-logo">
                        <Zap size={40} />
                    </div>
                    <h2>MERN SMTP</h2>
                    <p className="text-muted">Professional Email Management System</p>
                </div>

                <div className="about-content">
                    <div className="about-section mission-section">
                        <h3>Our Mission</h3>
                        <p>
                            To empower developers and businesses with a robust, secure, and efficient email infrastructure.
                            We believe in simplifying communication workflows while ensuring maximum deliverability and reliability.
                        </p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-item">
                            <div className="feature-icon-wrapper">
                                <Shield size={24} />
                            </div>
                            <h4>Secure Sending</h4>
                            <p>Enterprise-grade security with OAuth2 authentication and encrypted transmission.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon-wrapper">
                                <Globe size={24} />
                            </div>
                            <h4>Global Reach</h4>
                            <p>Optimized for high deliverability across all major email providers worldwide.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon-wrapper">
                                <Code size={24} />
                            </div>
                            <h4>Developer Friendly</h4>
                            <p>Built with the MERN stack, offering a modern and extensible architecture.</p>
                        </div>
                    </div>

                    <div className="social-links">
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link github">
                            <Github size={24} />
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                            <Linkedin size={24} />
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link twitter">
                            <Twitter size={24} />
                        </a>
                    </div>

                    <div className="about-footer">
                        <p>
                            Built with <Heart size={16} className="heart-icon" /> by the <strong>MERN SMTP Team</strong>
                        </p>
                        <p className="version">Version 1.0.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
