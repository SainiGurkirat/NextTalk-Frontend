// frontend/components/ChatWindow.js
import React, { useRef, useEffect } from 'react';
import Image from 'next/image';

const ChatWindow = ({ chat, messages, onSendMessage, currentUser, loadingMessages }) => {
  const [inputContent, setInputContent] = React.useState('');
  const messagesEndRef = useRef(null);

  // Effect to scroll to the bottom when messages change.
  // We explicitly avoid using `loadingMessages` as a dependency here
  // to prevent unnecessary re-runs or flashes of "Loading messages...".
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]); // <-- Removed loadingMessages from dependencies

  const handleInputChange = (e) => {
    setInputContent(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputContent.trim()) {
      onSendMessage(inputContent.trim());
      setInputContent('');
    }
  };

  const chatDisplayName = chat.isGroupChat
    ? chat.name
    : chat.participants.find(p => p._id !== currentUser._id)?.username || 'Unknown User';

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center">
        <div className="relative w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold text-lg mr-3">
          {chat.isGroupChat ? chatDisplayName[0]?.toUpperCase() : chatDisplayName[0]?.toUpperCase()}
        </div>
        <h2 className="text-xl font-semibold text-white">{chatDisplayName}</h2>
      </div>

      {/* Messages Display Area */}
      <div
        ref={messagesEndRef}
        className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col space-y-2"
      >
        {/* Conditional rendering for loading messages */}
        {loadingMessages ? (
          <p className="text-center text-gray-500">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500">Start a conversation!</p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg._id || index}
              className={`flex ${msg.sender._id === currentUser._id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                  msg.sender._id === currentUser._id
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-700 text-gray-100 rounded-bl-none'
                }`}
              >
                {msg.sender._id !== currentUser._id && (
                  <p className="font-semibold text-sm mb-1">
                    {msg.sender.username}
                  </p>
                )}
                <p className="text-base break-words">{msg.content}</p>
                <span className="text-xs text-right block mt-1 opacity-75">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input Area */}
      <form onSubmit={handleSubmit} className="bg-gray-800 p-4 border-t border-gray-700 flex items-center">
        <input
          type="text"
          value={inputContent}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="ml-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;