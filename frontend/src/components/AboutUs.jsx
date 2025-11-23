import React from 'react';
import { Shield, Zap, Globe, Heart, Code, Github, Linkedin, Twitter, Mail } from 'lucide-react';

const AboutUs = () => {
    return (
        <div className="about-container fade-in">
            <div className="about-hero">
                <div className="hero-content">
                    <div className="hero-icon">
                        <Mail size={48} />
                    </div>
                    <h1>MERN SMTP</h1>
                    <p className="hero-subtitle">The Ultimate Email Management Solution</p>
                    <div className="hero-badges">
                        <span className="hero-badge">v1.0.0</span>
                        <span className="hero-badge">Open Source</span>
                    </div>
                </div>
            </div>

            <div className="about-grid">
                <div className="glass-card mission-card">
                    <div className="card-icon">
                        <Zap size={32} />
                    </div>
                    <h3>Our Mission</h3>
                    <p>
                        To empower developers with a robust, secure, and efficient email infrastructure.
                        We simplify communication workflows while ensuring maximum deliverability.
                    </p>
                </div>

                <div className="glass-card feature-card">
                    <Shield size={24} className="text-primary" />
                    <h4>Secure Sending</h4>
                    <p>Enterprise-grade security with OAuth2 authentication.</p>
                </div>

                <div className="glass-card feature-card">
                    <Globe size={24} className="text-success" />
                    <h4>Global Reach</h4>
                    <p>Optimized for high deliverability worldwide.</p>
                </div>

                <div className="glass-card feature-card">
                    <Code size={24} className="text-secondary" />
                    <h4>Developer First</h4>
                    <p>Built with the MERN stack for easy extensibility.</p>
                </div>
            </div>

            <div className="social-section">
                <h3>Connect With Us</h3>
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
            </div>

            <div className="about-footer">
                <p>
                    Built with <Heart size={16} className="heart-icon" /> by the <strong>MERN SMTP Team</strong>
                </p>
            </div>
        </div>
    );
};

export default AboutUs;
