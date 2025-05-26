// frontend/components/ChatInput.js
import React, { useState, useCallback } from 'react';

const ChatInput = ({ onSendMessage }) => {
    const [content, setContent] = useState('');

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (content.trim()) {
            onSendMessage(content);
            setContent('');
        }
    }, [content, onSendMessage]);

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-800 border-t border-gray-700 flex items-center">
            <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow p-3 rounded-l-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                // Ensure no 'disabled' attribute is present here if not intended
            />
            <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-r-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!content.trim()}
            >
                Send
            </button>
        </form>
    );
};

export default ChatInput;