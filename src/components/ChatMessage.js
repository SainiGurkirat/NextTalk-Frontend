// frontend/components/ChatMessage.js
import React from 'react';
import { format } from 'date-fns';

const ChatMessage = ({ message, currentUser }) => {
    // --- DEBUG CONSOLE LOGS (you can remove these once the issue is resolved) ---
    console.log('[ChatMessage Debug] Message received:', message);
    console.log('[ChatMessage Debug] message.mediaUrl:', message.mediaUrl);
    console.log('[ChatMessage Debug] message.mediaType:', message.mediaType);
    console.log('[ChatMessage Debug] NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
    console.log('[ChatMessage Debug] Constructed media src:', `${process.env.NEXT_PUBLIC_BACKEND_URL}${message.mediaUrl}`);
    console.log('[ChatMessage Debug] isMyMessage:', message.sender._id === currentUser._id);
    // --- END DEBUG CONSOLE LOGS ---

    // Ensure essential data exists before rendering
    if (!message || !message.sender || !currentUser || !currentUser._id) {
        console.warn("ChatMessage: Missing essential data. Message or sender or currentUser._id is missing.", { message, currentUser });
        return null; // Don't render if essential data is missing
    }

    const isMyMessage = message.sender._id === currentUser._id;

    // Outer container for message alignment (left/right)
    const messageContainerClasses = `flex mb-4 ${isMyMessage ? 'justify-end' : 'justify-start'}`;

    // Inner container for avatar and bubble alignment (row or row-reverse) and max width
    const messageContentContainerClasses = `flex items-end max-w-[70%] ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`;

    // Message bubble styling
    const messageBubbleClasses = `rounded-lg p-3 shadow-md ${
        isMyMessage
            ? 'bg-blue-600 text-white rounded-br-none' // My message
            : message.isSystemMessage
                ? 'bg-gray-700 text-white text-center italic rounded-lg' // System message
                : 'bg-gray-700 text-gray-100 rounded-bl-none' // Other user's message
    }`;

    // Format timestamp from message.createdAt
    const timestamp = message.createdAt ? format(new Date(message.createdAt), 'h:mm a') : '';

    // Special rendering for system messages
    if (message.isSystemMessage) {
        return (
            <div className="flex justify-center mb-2">
                <div className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full italic">
                    {message.content}
                </div>
            </div>
        );
    }

    // Determine if there is meaningful text content to display
    // A message has text content if message.content exists and is not just whitespace
    // AND it's not purely a media message where content === mediaUrl
    const hasTextContent = message.content && message.content.trim().length > 0 && message.content !== message.mediaUrl;

    // Determine if the message is purely an attachment (no other text content)
    const isPureAttachment = !hasTextContent && message.mediaUrl;

    // Determine sender's profile picture for the avatar
    const senderProfilePicture = message.sender.profilePicture || `https://placehold.co/32x32/374151/E5E7EB?text=${message.sender.username ? message.sender.username[0].toUpperCase() : '?'}`;

    return (
        <div className={messageContainerClasses}>
            <div className={messageContentContainerClasses}>
                {/* Sender's Profile Picture */}
                <img
                    src={senderProfilePicture}
                    alt={message.sender.username}
                    className="w-8 h-8 rounded-full object-cover mx-2"
                    onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = `https://placehold.co/32x32/374151/E5E7EB?text=${message.sender.username ? message.sender.username[0].toUpperCase() : '?'}`;
                    }}
                />

                {/* Message Bubble */}
                <div className={messageBubbleClasses}>
                    {/* Display sender's username for messages from others */}
                    {!isMyMessage && (
                        <p className="font-semibold text-sm mb-1">
                            {message.sender.username}
                        </p>
                    )}

                    {/* Render text content if applicable */}
                    {hasTextContent && (
                        <p className="break-words text-sm">{message.content}</p>
                    )}

                    {/* Render "Attachment" text if it's a pure attachment message */}
                    {isPureAttachment && (
                        <p className="break-words text-sm italic text-gray-300">Attachment</p>
                    )}

                    {/* Render media if available (using mediaUrl and mediaType directly) */}
                    {message.mediaUrl && message.mediaType === 'image' && (
                        <img
                            // Using the environment variable now that .env is fixed
                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${message.mediaUrl}`}
                            alt="Attached Image"
                            className="max-w-xs max-h-48 rounded-lg mt-2 cursor-pointer"
                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL}${message.mediaUrl}`, '_blank')}
                        />
                    )}
                    {message.mediaUrl && message.mediaType === 'gif' && (
                        <img
                            // Using the environment variable now that .env is fixed
                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${message.mediaUrl}`}
                            alt="Attached GIF"
                            className="max-w-xs max-h-48 rounded-lg mt-2 cursor-pointer"
                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL}${message.mediaUrl}`, '_blank')}
                        />
                    )}
                    {message.mediaUrl && message.mediaType === 'video' && (
                        <video
                            // Using the environment variable now that .env is fixed
                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${message.mediaUrl}`}
                            controls
                            className="max-w-xs max-h-48 rounded-lg mt-2"
                        />
                    )}

                    {/* Timestamp */}
                    <div className={`text-xs mt-1 ${isMyMessage ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                        {timestamp}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;