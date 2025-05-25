// frontend/components/ChatList.js

import React from 'react';
import Image from 'next/image'; // Assuming you use Next.js Image component

const ChatList = ({ chats, onSelectChat, selectedChatId, currentUser }) => {
  return (
    <div className="space-y-2">
      {chats.length === 0 ? (
        <p className="text-gray-500 text-center">No chats found. Search for users to start one!</p>
      ) : (
        chats.map((chat) => {
          // Determine the display name for private chats
          const otherParticipant = chat.participants.find(
            (p) => p._id !== currentUser._id
          );
          const chatDisplayName = chat.isGroupChat
            ? chat.name // Use chat.name for group chats
            : otherParticipant
            ? otherParticipant.username // Use other participant's username for private chats
            : 'Unknown User'; // Fallback if no other participant found

          const isActive = selectedChatId === chat._id;

          return (
            <div
              key={chat._id}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-200
                ${isActive ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              onClick={() => onSelectChat(chat)}
            >
              <div className="relative w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold text-lg mr-3">
                {/* You can display profile picture here if available */}
                {/* Example: <Image src={otherParticipant.profilePictureUrl} alt="Avatar" width={40} height={40} className="rounded-full" /> */}
                {chatDisplayName[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${isActive ? 'text-white' : 'text-gray-100'}`}>
                  {chatDisplayName}
                </h3>
                {/* --- THIS SECTION IS CRUCIAL FOR DISPLAYING LAST MESSAGE --- */}
                {chat.lastMessage ? (
                  <p className={`text-sm ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                    {chat.lastMessage.sender && chat.lastMessage.sender._id === currentUser._id
                        ? 'You: '
                        : `${chat.lastMessage.sender?.username || 'Unknown'}: `}
                    {chat.lastMessage.content}
                  </p>
                ) : (
                  <p className={`text-sm ${isActive ? 'text-blue-200' : 'text-gray-500 italic'}`}>
                    No messages yet.
                  </p>
                )}
                {/* -------------------------------------------------------- */}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChatList;