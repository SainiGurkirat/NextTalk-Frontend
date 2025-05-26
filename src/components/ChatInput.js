// frontend/components/ChatInput.js
import React, { useState } from 'react';
// import styles from '../styles/ChatInput.module.css'; // REMOVE THIS LINE IF USING TAILWIND

const ChatInput = ({ onSendMessage, currentChatId, showNotification }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && currentChatId) {
      onSendMessage(currentChatId, message.trim());
      setMessage('');
    } else if (!currentChatId) {
      showNotification('Please select a chat to send messages.', 'warning');
    }
  };

  return (
    // Replace the outer div's class with Tailwind classes
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800 border-t border-gray-700 flex items-center gap-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        // Replace input classes with Tailwind classes
        className="flex-grow p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
        disabled={!currentChatId}
      />
      <button
        type="submit"
        // Replace button classes with Tailwind classes
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!currentChatId || !message.trim()}
      >
        Send
      </button>
    </form>
  );
};

export default ChatInput;