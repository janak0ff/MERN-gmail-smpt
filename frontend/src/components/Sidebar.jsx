import React from 'react';
import { Send, History, BarChart3, Info } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'compose', icon: Send, label: 'Compose' },
        { id: 'history', icon: History, label: 'History' },
        { id: 'stats', icon: BarChart3, label: 'Analytics' },
        { id: 'about', icon: Info, label: 'About Us' },
    ];

    return (
        <aside className="sidebar">
            <nav className="nav-menu">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                        {activeTab === item.id && <div className="active-indicator" />}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="avatar">A</div>
                    <div className="user-details">
                        <span className="user-name">Admin User</span>
                        <span className="user-role">Administrator</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
