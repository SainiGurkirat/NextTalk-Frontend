import { useState } from 'react';

const ChatInput = ({ onSendMessage, onTyping }) => {
  const [message, setMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    // Emit typing event
    if (onTyping) {
      if (!typingTimeout) {
        onTyping(true); // User started typing
      }
      clearTimeout(typingTimeout);
      setTypingTimeout(setTimeout(() => {
        onTyping(false); // User stopped typing
        setTypingTimeout(null);
      }, 1000)); // Emit 'stopped typing' after 1 second of no input
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
        onTyping(false); // Ensure typing status is reset on send
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center p-4 bg-white rounded-lg shadow-md mt-4">
      <input
        type="text"
        value={message}
        onChange={handleInputChange}
        placeholder="Type a message..."
        className="flex-1 p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary mr-2"
      />
      <button
        type="submit"
        className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out disabled:opacity-50"
        disabled={isLoading}
      >
        Send
      </button>
    </form>
  );
};

export default ChatInput;