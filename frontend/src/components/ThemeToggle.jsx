import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { toggleTheme } = useTheme();

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
        >
            <div className="theme-icon sun">
                <Sun size={20} />
            </div>
            <div className="theme-icon moon">
                <Moon size={20} />
            </div>
        </button>
    );
};

export default ThemeToggle;
