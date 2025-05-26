// frontend/components/ChatList.js
import React from 'react';

const ChatList = ({ chats, onSelectChat, selectedChatId, currentUser }) => {
  if (!chats || chats.length === 0) {
    return <p className="text-center text-gray-500 mt-4">No chats yet.</p>;
  }

  const getChatDisplayName = (chat) => {
    if (chat.type === 'group') {
      return chat.name || 'Unnamed Group'; // Display group name
    } else {
      // For private chats, find the other participant
      const otherParticipant = chat.participants.find(p => p._id !== currentUser?._id);
      return otherParticipant ? otherParticipant.username : 'Unknown User';
    }
  };

  const getChatAvatarText = (chat) => {
    if (chat.type === 'group') {
        return chat.name ? chat.name.charAt(0).toUpperCase() : 'G';
    } else {
        const otherParticipant = chat.participants.find(p => p._id !== currentUser?._id);
        return otherParticipant ? otherParticipant.username.charAt(0).toUpperCase() : '?';
    }
  };

  return (
    <div className="space-y-2">
      {chats.map(chat => (
        <div
          key={chat._id}
          onClick={() => onSelectChat(chat)}
          className={`
            flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-200
            ${selectedChatId === chat._id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}
          `}
        >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg mr-3">
                {getChatAvatarText(chat)}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <h3 className="text-white font-semibold truncate">{getChatDisplayName(chat)}</h3>
                    {/* Defensive check for chat.lastMessage and its timestamp */}
                    {chat.lastMessage && chat.lastMessage.timestamp && (
                        <span className="text-gray-400 text-xs ml-2">
                            {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
                {chat.lastMessage ? (
                    <p className="text-gray-300 text-sm truncate mt-1">
                        {/* Defensive checks for chat.lastMessage.sender and _id */}
                        {chat.lastMessage.sender && chat.lastMessage.sender._id === currentUser?._id ? 'You: ' : ''}
                        {chat.lastMessage.content}
                    </p>
                ) : (
                    <p className="text-gray-400 text-sm italic mt-1">No messages yet.</p>
                )}
            </div>

            {/* Unread Count */}
            {chat.unreadCount > 0 && (
                <span className="ml-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    {chat.unreadCount}
                </span>
            )}
        </div>
      ))}
    </div>
  );
};

export default ChatList;