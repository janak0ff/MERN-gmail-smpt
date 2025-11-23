import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { toggleTheme } = useTheme();

    return (
        <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
        >
            <div className="toggle-track">
                <div className="toggle-icon sun">
                    <Sun size={18} />
                </div>
                <div className="toggle-icon moon">
                    <Moon size={18} />
                </div>
                <div className="toggle-thumb" />
            </div>
        </button>
    );
};

export default ThemeToggle;
