// frontend/components/ChatMessage.js
import React from 'react';

const ChatMessage = ({ message, currentUser }) => {
  // CHANGE 2: Ensure currentUser and currentUser._id exist
  if (!message || !message.sender || !currentUser || !currentUser._id) {
    console.warn("ChatMessage: Missing essential data. Message or sender or currentUser._id is missing.", { message, currentUser });
    return null; // Don't render if essential data is missing
  }

  // CHANGE 3: Use currentUser._id for comparison
  const isMyMessage = message.sender._id === currentUser._id;

  return (
    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] p-3 rounded-lg shadow-md ${
        isMyMessage
          ? 'bg-blue-600 text-white rounded-br-none' // My message
          : 'bg-gray-700 text-white rounded-bl-none' // Other user's message
      }`}>
        {!isMyMessage && ( // Display sender's username for messages from others
          <div className="font-semibold text-sm mb-1">
            {message.sender.username}
          </div>
        )}
        <p className="break-words">{message.content}</p>
        <div className={`text-xs mt-1 ${isMyMessage ? 'text-blue-200' : 'text-gray-400'} text-right`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;