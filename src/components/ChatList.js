import React from 'react';

const ChatList = ({ chats, onSelectChat, selectedChatId, currentUser, onRemoveChat }) => {
    // grab the first letter for fallback avatars
    const getFirstLetter = (name) => {
        if (name && typeof name === 'string' && name.trim().length > 0) {
            return name.trim()[0].toUpperCase();
        }
        return '?';
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
                            // get the other user in the private chat
                            const otherParticipant = chat.participants.find(p => p._id !== currentUser._id);

                            if (otherParticipant && otherParticipant.username) {
                                chatDisplayName = otherParticipant.username;
                                chatDisplayImage = otherParticipant.profilePicture || `https://placehold.co/40x40/374151/E5E7EB?text=${getFirstLetter(otherParticipant.username)}`;
                            } else if (chat.participants.length === 1 && chat.participants[0]._id === currentUser._id) {
                                return;
                            } else {
                                chatDisplayName = 'Unknown User';
                                chatDisplayImage = `https://placehold.co/40x40/374151/E5E7EB?text=U`;
                            }
                        } else {
                            chatDisplayName = chat.name || 'Group Chat';
                            chatDisplayImage = chat.profilePicture || `https://placehold.co/40x40/374151/E5E7EB?text=G`;
                        }

                        let displayLastMessage = "No messages yet.";

                        if (chat.lastMessage) {
                            const lastMessageContent = chat.lastMessage.content;
                            const lastMessageSenderName = chat.lastMessage.sender?.username;
                            const senderPrefix = lastMessageSenderName ? `${lastMessageSenderName}: ` : '';

                            const hasTextContent = lastMessageContent && lastMessageContent.trim().length > 0;
                            const isMediaMessage = chat.lastMessage.mediaUrl;

                            if (isMediaMessage && !hasTextContent) {
                                // no text, just media, show icon + label
                                let mediaTypeLabel = '';
                                switch (chat.lastMessage.mediaType) {
                                    case 'image':
                                        mediaTypeLabel = <><i className="fas fa-image mr-1"></i> Image Attachment</>;
                                        break;
                                    case 'video':
                                        mediaTypeLabel = <><i className="fas fa-video mr-1"></i> Video Attachment</>;
                                        break;
                                    case 'gif':
                                        mediaTypeLabel = <><i className="fas fa-file-image mr-1"></i> GIF Attachment</>;
                                        break;
                                    default:
                                        mediaTypeLabel = <><i className="fas fa-paperclip mr-1"></i> Attachment</>;
                                }
                                displayLastMessage = <>{senderPrefix}{mediaTypeLabel}</>;
                            } else if (hasTextContent) {
                                // show sender + text, cut off if long
                                const messageText = `${lastMessageContent}`;
                                displayLastMessage = `${senderPrefix}${messageText.length > 30
                                    ? messageText.substring(0, 27) + '...'
                                    : messageText}`;
                            }
                        }

                        const isActive = selectedChatId === chat._id;

                        const handleRemoveClick = (e) => {
                            e.stopPropagation(); // don't trigger chat selection
                            const actionText = isGroupChat ? 'leave' : 'hide';
                            if (window.confirm(`Are you sure you want to ${actionText} this chat?`)) {
                                onRemoveChat(chat._id, isGroupChat);
                            }
                        };

                        return (
                            <li
                                key={chat._id}
                                onClick={() => onSelectChat(chat)}
                                className={`
                                    relative flex items-center px-3 py-2.5 cursor-pointer transition-colors duration-200 rounded-md mx-1 my-1 text-white group
                                    ${isActive ? 'bg-blue-800' : 'hover:bg-gray-700'}
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

                                {/* delete/leave chat button shows on hover */}
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
