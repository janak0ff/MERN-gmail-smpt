import React, { useState } from 'react';
import { PenSquare, History, BarChart3, Info, Home, Menu, X, Mail } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ activeTab, setActiveTab, onCheckHealth }) => {


    const navItems = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'compose', icon: PenSquare, label: 'Compose' },
        { id: 'history', icon: History, label: 'History' },
        { id: 'stats', icon: BarChart3, label: 'Analytics' },
        { id: 'about', icon: Info, label: 'About' },
    ];

    const handleNavClick = (tabId) => {
        setActiveTab(tabId);
    };

    return (
        <>
            <nav className="navbar-modern">
                <div className="navbar-container">
                    <div className="navbar-brand">
                        <div className="brand-icon">
                            <Mail size={22} />
                        </div>
                        <span className="brand-text">Quick Mail</span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="navbar-links">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                className={`nav-link-modern ${activeTab === item.id ? 'active' : ''}`}
                                onClick={() => handleNavClick(item.id)}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="navbar-actions">
                        <ThemeToggle />
                        <button
                            className="status-indicator"
                            onClick={onCheckHealth}
                        >
                            <div className="status-dot pulse"></div>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <div className="bottom-nav">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`bottom-nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => handleNavClick(item.id)}
                    >
                        <item.icon size={20} />
                        <span className="bottom-nav-label">{item.label}</span>
                    </button>
                ))}
            </div>
        </>
    );
};

export default Navbar;
