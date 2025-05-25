// frontend/components/ChatList.js (Updated for unread indicator)

import React from 'react';
import Image from 'next/image';

const ChatList = ({ chats, onSelectChat, selectedChatId, currentUser }) => {
  return (
    <div className="space-y-2">
      {chats.length === 0 ? (
        <p className="text-gray-500 text-center">No chats found. Search for users to start one!</p>
      ) : (
        chats.map((chat) => {
          const otherParticipant = chat.participants.find(
            (p) => p._id !== currentUser._id
          );
          const chatDisplayName = chat.isGroupChat
            ? chat.name
            : otherParticipant
            ? otherParticipant.username
            : 'Unknown User';

          const isActive = selectedChatId === chat._id;
          // Determine if there are unread messages for this chat
          // The backend now sends `unreadCount`
          const hasUnread = chat.unreadCount > 0;

          return (
            <div
              key={chat._id}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-200
                ${isActive ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}
                ${hasUnread ? 'font-bold' : ''} `} 
              onClick={() => onSelectChat(chat)}
            >
              <div className="relative w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold text-lg mr-3">
                {chatDisplayName[0]?.toUpperCase()}
                {/* Optional: Unread badge */}
                {hasUnread && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${isActive ? 'text-white' : 'text-gray-100'}`}>
                  {chatDisplayName}
                </h3>
                {chat.lastMessage ? (
                  <p className={`text-sm ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                    {chat.lastMessage.sender && chat.lastMessage.sender._id === currentUser._id
                        ? 'You: '
                        : `${chat.lastMessage.sender?.username || 'Unknown'}: `}
                    <span className={`${hasUnread ? 'text-white' : ''}`}> {/* Make last message text white if unread */}
                      {chat.lastMessage.content}
                    </span>
                  </p>
                ) : (
                  <p className={`text-sm ${isActive ? 'text-blue-200' : 'text-gray-500 italic'}`}>
                    No messages yet.
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChatList;