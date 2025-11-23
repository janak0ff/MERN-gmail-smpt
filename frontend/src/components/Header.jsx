import React from 'react';
import { Mail } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Header = ({ onCheckHealth }) => {
    return (
        <header className="app-header">
            <div className="header-content">
                <div className="logo-container">
                    <div className="logo-icon">
                        <Mail size={28} color="white" />
                    </div>
                    <div className="logo-text">
                        <h1>MERN SMTP</h1>
                        <span className="badge">PRO</span>
                    </div>
                    <ThemeToggle />
                </div>
                <p className="header-subtitle">Professional Email Management System</p>
            </div>
            <button
                onClick={onCheckHealth}
                className="btn btn-glass health-btn"
            >
                <span className="pulse-dot"></span>
                System Health
            </button>
        </header>
    );
};

export default Header;
