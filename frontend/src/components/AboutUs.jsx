import React from 'react';
import { Shield, Zap, Globe, Heart, Code, Github, Linkedin, Twitter, Mail, ExternalLink, ArrowRight } from 'lucide-react';

const AboutUs = () => {
    return (
        <div className="about-modern fade-in">
            <div className="about-header-modern">
                <div className="brand-pill">
                    <Mail size={16} />
                    <span>MERN SMTP v1.0</span>
                </div>
                <h1>Redefining Email Infrastructure</h1>
                <p className="hero-subtitle">
                    A powerful, open-source solution for seamless email delivery.
                    Built for developers who demand reliability and speed.
                </p>
            </div>

            <div className="mission-section glass-card">
                <div className="mission-content">
                    <div className="icon-box primary">
                        <Zap size={28} />
                    </div>
                    <h2>Our Mission</h2>
                    <p>
                        To empower developers with a robust, secure, and efficient email infrastructure.
                        We simplify communication workflows while ensuring maximum deliverability,
                        so you can focus on building great applications.
                    </p>
                </div>
            </div>

            <div className="features-grid-modern">
                <div className="feature-card-modern">
                    <div className="icon-box success">
                        <Shield size={24} />
                    </div>
                    <h3>Secure Sending</h3>
                    <p>Enterprise-grade security with OAuth2 authentication and encrypted transmission.</p>
                </div>

                <div className="feature-card-modern">
                    <div className="icon-box info">
                        <Globe size={24} />
                    </div>
                    <h3>Global Reach</h3>
                    <p>Optimized for high deliverability worldwide, ensuring your emails reach the inbox.</p>
                </div>

                <div className="feature-card-modern">
                    <div className="icon-box secondary">
                        <Code size={24} />
                    </div>
                    <h3>Developer First</h3>
                    <p>Built with the MERN stack for easy extensibility and seamless integration.</p>
                </div>
            </div>

            <div className="connect-section">
                <h3>Connect With Us</h3>
                <div className="social-links-modern">
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-btn github">
                        <Github size={20} />
                        <span>GitHub</span>
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-btn linkedin">
                        <Linkedin size={20} />
                        <span>LinkedIn</span>
                    </a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-btn twitter">
                        <Twitter size={20} />
                        <span>Twitter</span>
                    </a>
                    <a href="https://example.com" target="_blank" rel="noopener noreferrer" className="social-btn website">
                        <Globe size={20} />
                        <span>Website</span>
                        <ExternalLink size={14} className="external-icon" />
                    </a>
                </div>
            </div>

            <div className="about-footer-modern">
                <p>
                    Built with <Heart size={16} className="heart-icon-anim" /> by the <strong>MERN SMTP Team</strong>
                </p>
            </div>
        </div>
    );
};

export default AboutUs;
