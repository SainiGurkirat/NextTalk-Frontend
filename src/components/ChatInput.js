// frontend/components/ChatInput.js
import React, { useState } from 'react'; // CORRECTED LINE
// import React, { useState } => { // INCORRECT LINE I PROVIDED PREVIOUSLY

const ChatInput = ({ onSendMessage }) => { // onSendMessage prop added
  const [inputContent, setInputContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputContent.trim()) {
      onSendMessage(inputContent.trim()); // Call the parent's onSendMessage
      setInputContent(''); // Clear input after sending
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={inputContent}
        onChange={(e) => setInputContent(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Send
      </button>
    </form>
  );
};

export default ChatInput;