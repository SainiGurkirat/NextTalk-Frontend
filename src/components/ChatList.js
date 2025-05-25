// frontend/components/ChatList.js
import React from 'react';

// Props: chats, onSelectChat, selectedChatId, currentUser
const ChatList = ({ chats, onSelectChat, selectedChatId, currentUser }) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {chats.length === 0 ? (
        <p className="text-gray-400 text-center p-4">No chats yet. Search for users to start one!</p>
      ) : (
        <ul>
          {chats.map((chat) => {
            // Determine the display name for the chat
            let chatDisplayName = '';
            if (chat.type === 'private') {
              // Find the other participant in a private chat
              // CHANGE: Use currentUser?._id instead of currentUser?.id
              const otherParticipant = chat.participants.find(p => p._id !== currentUser?._id);
              chatDisplayName = otherParticipant?.username || 'Unknown User';
            } else {
              // For group chats, use the chat's 'name' property
              chatDisplayName = chat.name || 'Group Chat';
            }

            // Get last message content for display
            const lastMessageContent = chat.lastMessage?.content || "No messages yet.";
            const lastMessageSender = chat.lastMessage?.sender?.username;
            const displayLastMessage = lastMessageSender
              ? `${lastMessageSender}: ${lastMessageContent}`
              : lastMessageContent;

            const isActive = selectedChatId === chat._id; // Check if this chat is currently selected

            return (
              <li
                key={chat._id} // Assuming chat objects have a unique _id
                onClick={() => onSelectChat(chat)} // Call onSelectChat with the full chat object
                className={`flex items-center p-4 cursor-pointer hover:bg-gray-700 transition-colors duration-200 ${isActive ? 'bg-blue-600 hover:bg-blue-600' : 'bg-gray-800'}`}
              >
                {/* Placeholder for chat avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white text-lg font-bold mr-3">
                  {chatDisplayName ? chatDisplayName[0].toUpperCase() : ''}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{chatDisplayName}</h3>
                  <p className={`text-sm ${isActive ? 'text-blue-200' : 'text-gray-400'} truncate`}>
                    {displayLastMessage}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ChatList;