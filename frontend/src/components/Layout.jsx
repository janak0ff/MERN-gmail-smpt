import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children, activeTab, setActiveTab, onCheckHealth }) => {
    return (
        <div className="app-layout">
            <Navbar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onCheckHealth={onCheckHealth}
            />

            <main className="main-wrapper">
                <div className="main-content">
                    <div className="content-container">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
