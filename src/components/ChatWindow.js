// frontend/components/ChatWindow.js
import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const ChatWindow = ({ chat, messages, onSendMessage, currentUser, loadingMessages }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chat]);

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-lg">
        Select a chat to start messaging
      </div>
    );
  }

  // Determine chat name for private chats (the other participant's username)
  const chatName = chat.type === 'private'
    // CHANGE 1: Use currentUser?._id instead of currentUser?.id
    ? chat.participants.find(p => p._id !== currentUser?._id)?.username || 'Unknown User'
    : chat.name || 'Group Chat';

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Chat Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold mr-3">
          {chatName ? chatName[0].toUpperCase() : ''}
        </div>
        <h2 className="text-xl font-semibold">{chatName}</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loadingMessages ? (
          <p className="text-center text-gray-500">Loading messages...</p>
        ) : (
          messages.length === 0 ? (
            <p className="text-center text-gray-500">No messages yet. Send one!</p>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message._id || message.id} message={message} currentUser={currentUser} />
            ))
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <ChatInput onSendMessage={onSendMessage} />
      </div>
    </div>
  );
};

export default ChatWindow;