// --- File: src/components/ChatList.js ---
import React from 'react';

const ChatList = ({ chats, onSelectChat, selectedChatId, currentUser, onRemoveChat }) => {
    // Helper function to safely get the first letter of a string for avatars
    const getFirstLetter = (name) => {
        if (name && typeof name === 'string' && name.trim().length > 0) {
            return name.trim()[0].toUpperCase();
        }
        return '?'; // Default fallback if name is invalid or empty
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {chats.length === 0 ? (
                <p className="text-gray-400 text-center p-4">No chats yet. Search for users to start one!</p>
            ) : (
                <ul className="py-2 px-2">
                    {chats.map((chat) => {
                        let chatDisplayName = '';
                        let chatDisplayImage = '';
                        const isGroupChat = chat.type === 'group';

                        if (chat.type === 'private') {
                            const otherParticipant = chat.participants.find(p => p._id !== currentUser._id);

                            if (otherParticipant && otherParticipant.username) {
                                chatDisplayName = otherParticipant.username;
                                chatDisplayImage = otherParticipant.profilePicture || `https://placehold.co/40x40/374151/E5E7EB?text=${getFirstLetter(otherParticipant.username)}`;
                            } else if (chat.participants.length === 1 && chat.participants[0]._id === currentUser._id) {
                                chatDisplayName = `${currentUser.username} (You)`;
                                chatDisplayImage = currentUser.profilePicture || `https://placehold.co/40x40/374151/E5E7EB?text=${getFirstLetter(currentUser.username)}`;
                            } else {
                                chatDisplayName = 'Unknown User';
                                chatDisplayImage = `https://placehold.co/40x40/374151/E5E7EB?text=U`;
                            }
                        } else { // Group chat
                            chatDisplayName = chat.name || 'Group Chat';
                            chatDisplayImage = chat.profilePicture || `https://placehold.co/40x40/374151/E5E7EB?text=G`;
                        }

                        // Get last message content for display
                        const lastMessageContent = chat.lastMessage?.content || "No messages yet.";
                        const lastMessageSender = chat.lastMessage?.sender?.username;
                        const displayLastMessage = lastMessageSender
                            ? `${lastMessageSender}: ${lastMessageContent}`
                            : lastMessageContent;

                        const isActive = selectedChatId === chat._id;

                        // Handler for the remove button click
                        const handleRemoveClick = (e) => {
                            e.stopPropagation(); // Prevent the li's onClick (chat selection) from firing
                            const actionText = isGroupChat ? 'leave' : 'hide';
                            if (window.confirm(`Are you sure you want to ${actionText} this chat?`)) {
                                onRemoveChat(chat._id, isGroupChat);
                            }
                        };

                        return (
                            <li
                                key={chat._id}
                                onClick={() => onSelectChat(chat)} // Pass the whole chat object for selection
                                className={`
                                    relative flex items-center px-3 py-2.5 cursor-pointer transition-colors duration-200 rounded-md mx-1 my-1 text-white group
                                    ${isActive
                                        ? 'bg-blue-800'
                                        : 'hover:bg-gray-700'
                                    }
                                `}
                            >
                                <img
                                    src={chatDisplayImage}
                                    alt={chatDisplayName}
                                    className="w-10 h-10 rounded-full mr-3 object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://placehold.co/40x40/374151/E5E7EB?text=${chat.type === 'group' ? 'G' : getFirstLetter(chatDisplayName)}`;
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white truncate">{chatDisplayName}</h3>
                                    <p className="text-sm text-gray-400 truncate">
                                        {displayLastMessage}
                                    </p>
                                </div>
                                {chat.unreadCount > 0 && (
                                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full ml-2 flex-shrink-0"></div>
                                )}

                                {/* Remove Chat Button */}
                                <button
                                    onClick={handleRemoveClick}
                                    title={isGroupChat ? "Leave Group" : "Hide Chat"}
                                    className="
                                        absolute right-2 top-1/2 -translate-y-1/2 p-1
                                        bg-red-500 text-white rounded-full
                                        opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                        focus:outline-none focus:ring-2 focus:ring-red-300
                                    "
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default ChatList;