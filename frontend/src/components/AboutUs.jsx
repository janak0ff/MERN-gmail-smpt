import React from 'react';
import { Shield, Zap, Globe, Heart, Code, Github, Linkedin, Mail, ExternalLink, ArrowRight, Sparkles, Target, Users } from 'lucide-react';

const AboutUs = () => {
    return (
        <div className="about-modern fade-in">
            <div className="about-header-modern">
                <div className="brand-pill">
                    <Mail size={16} />
                    <span>Quick Mail · Production-ready email workspace</span>
                </div>
                <h1>Empowering Communication Through Code</h1>
                <p className="hero-subtitle">
                    Quick Mail is a self-hosted email workspace for teams and developers who need
                    a clear, secure way to compose, schedule, and track SMTP messages without giving
                    up operational control.
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
                        that puts control back in their hands. The platform combines protected accounts,
                        user-scoped history, reusable content, queue-backed delivery, and practical
                        deployment automation in one focused application.
                    </p>
                </div>
            </div>

            <div className="features-grid-modern">
                <div className="feature-card-modern">
                    <div className="icon-box success">
                        <Shield size={24} />
                    </div>
                    <h3>Production-Grade Security</h3>
                    <p>Protected sessions, password hashing, verification and reset flows, rate limiting, secure headers, upload controls, and user-scoped data.</p>
                </div>

                <div className="feature-card-modern">
                    <div className="icon-box info">
                        <Globe size={24} />
                    </div>
                    <h3>Built for Operations</h3>
                    <p>Health endpoints, graceful shutdown, structured deployment documentation, and Docker-ready services make the platform easier to operate.</p>
                </div>

                <div className="feature-card-modern">
                    <div className="icon-box secondary">
                        <Code size={24} />
                    </div>
                    <h3>Flexible Deployment</h3>
                    <p>Deploy with Docker or PM2, use MongoDB Atlas or local MongoDB, and place host Nginx in front for TLS and reverse proxying.</p>
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
                        What began as a simple SMTP wrapper evolved into a full email workspace with rich text composition,
                        drafts, reusable templates, scheduled delivery, retryable background jobs, searchable history,
                        analytics, and a responsive interface. Every feature was designed with the developer experience in mind.
                    </p>
                    <div className="story-highlights">
                        <div className="highlight-item">
                            <Sparkles size={20} className="highlight-icon" />
                            <span>Docker, PM2, and host Nginx deployment ready</span>
                        </div>
                        <div className="highlight-item">
                            <Zap size={20} className="highlight-icon" />
                            <span>Redis/BullMQ queue with scheduled delivery and retries</span>
                        </div>
                        <div className="highlight-item">
                            <Users size={20} className="highlight-icon" />
                            <span>GitHub Actions, GHCR publishing, health checks, and rollback workflow</span>
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
                    Built with <Heart size={16} className="heart-icon" /> by <strong>Janak Shrestha</strong>
                </p>
                <p className="footer-tagline">
                    Making email delivery simple, secure, and beautiful
                </p>
            </div>
        </div>
    );
};

export default AboutUs;
