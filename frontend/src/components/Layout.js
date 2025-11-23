import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children, activeTab, setActiveTab, onCheckHealth }) => {
    return (
        <div className="app-layout">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="main-wrapper">
                <Header onCheckHealth={onCheckHealth} />
                <main className="main-content">
                    <div className="content-container">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
