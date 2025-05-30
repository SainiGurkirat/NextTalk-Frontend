import React, { useState } from 'react';

const HamburgerMenu = ({ onLogout, onGoToSettings }) => {
    const [isOpen, setIsOpen] = useState(false);

    // toggles the menu open/close state
    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    // handles logout click, closes menu and calls onlogout prop
    const handleLogoutClick = () => {
        setIsOpen(false); // close menu on click
        if (onLogout) {
            onLogout();
        }
    };

    // handles settings click, closes menu and calls ongotosettings prop
    const handleSettingsClick = () => {
        setIsOpen(false); // close menu on click
        if (onGoToSettings) {
            onGoToSettings();
        }
    };

    return (
        <div className="relative">
            {/* hamburger icon button */}
            <button
                onClick={toggleMenu}
                aria-label="menu">
            </button>

            {/* dropdown menu, visible when isopen is true */}
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-10"
                    onBlur={() => setIsOpen(false)} // close menu when focus leaves
                    tabIndex="-1" // make the div focusable for onblur to work
                >
                    {/* settings button */}
                    <button
                        onClick={handleSettingsClick}
                        className="block px-4 py-2 text-sm text-white hover:bg-gray-600 w-full text-left"
                    >
                        settings
                    </button>
                    {/* sign out button */}
                    <button
                        onClick={handleLogoutClick}
                        className="block px-4 py-2 text-sm text-red-400 hover:bg-gray-600 w-full text-left"
                    >
                        sign out
                    </button>
                </div>
            )}
        </div>
    );
};

export default HamburgerMenu;