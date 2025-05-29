// frontend/components/HamburgerMenu.js
import React, { useState } from 'react';

const HamburgerMenu = ({ onLogout, onGoToSettings }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleLogoutClick = () => {
        setIsOpen(false); // Close menu on click
        if (onLogout) {
            onLogout();
        }
    };

    const handleSettingsClick = () => {
        setIsOpen(false); // Close menu on click
        if (onGoToSettings) {
            onGoToSettings();
        }
    };

    return (
        <div className="relative">
            {/* Hamburger Icon */}
            <button
                onClick={toggleMenu}
                aria-label="Menu">
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-10"
                    onBlur={() => setIsOpen(false)} // Close menu when focus leaves
                    tabIndex="-1" // Make the div focusable
                >
                    <button
                        onClick={handleSettingsClick}
                        className="block px-4 py-2 text-sm text-white hover:bg-gray-600 w-full text-left"
                    >
                        Settings
                    </button>
                    <button
                        onClick={handleLogoutClick}
                        className="block px-4 py-2 text-sm text-red-400 hover:bg-gray-600 w-full text-left"
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

export default HamburgerMenu;