import React from 'react';

const StatCard = ({ icon: Icon, label, value, className }) => {
    return (
        <div className={`stat-card ${className || ''}`}>
            <div className="stat-icon-wrapper">
                <Icon size={24} className="stat-icon" />
            </div>
            <div className="stat-content">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
};

export default StatCard;
