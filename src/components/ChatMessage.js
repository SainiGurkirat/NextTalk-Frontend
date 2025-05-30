import React from 'react';
import { format } from 'date-fns';

const ChatMessage = ({ message, currentUser }) => {
    // don't render anything if important data is missing
    if (!message || !message.sender || !currentUser || !currentUser._id) return null;

    const isMyMessage = message.sender._id === currentUser._id;

    // aligns message left or right depending on sender
    const messageContainerClasses = `flex mb-4 ${isMyMessage ? 'justify-end' : 'justify-start'}`;
    const messageContentContainerClasses = `flex items-end max-w-[70%] ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`;

    // bubble style changes based on who sent it or if it's a system msg
    const messageBubbleClasses = `rounded-lg p-3 shadow-md ${
        isMyMessage
            ? 'bg-blue-600 text-white rounded-br-none'
            : message.isSystemMessage
                ? 'bg-gray-700 text-white text-center italic rounded-lg'
                : 'bg-gray-700 text-gray-100 rounded-bl-none'
    }`;

    const timestamp = message.createdAt ? format(new Date(message.createdAt), 'h:mm a') : '';

    // check if it's real text and not just an attachment link
    const hasTextContent = message.content && message.content.trim().length > 0 && message.content !== message.mediaUrl;
    const isPureAttachment = !hasTextContent && message.mediaUrl;

    // use profile picture or fallback to generated placeholder
    const senderProfilePicture = message.sender.profilePicture || `https://placehold.co/32x32/374151/E5E7EB?text=${message.sender.username ? message.sender.username[0].toUpperCase() : '?'}`;

    if (message.isSystemMessage) {
        return (
            <div className="flex justify-center mb-2">
                <div className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full italic">
                    {message.content}
                </div>
            </div>
        );
    }

    return (
        <div className={messageContainerClasses}>
            <div className={messageContentContainerClasses}>
                <img
                    src={senderProfilePicture}
                    alt={message.sender.username}
                    className="w-8 h-8 rounded-full object-cover mx-2"
                    onError={(e) => {
                        // fallback again if profile pic fails to load
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/32x32/374151/E5E7EB?text=${message.sender.username ? message.sender.username[0].toUpperCase() : '?'}`;
                    }}
                />

                <div className={messageBubbleClasses}>
                    {!isMyMessage && (
                        <p className="font-semibold text-sm mb-1">
                            {message.sender.username}
                        </p>
                    )}

                    {hasTextContent && (
                        <p className="break-words text-sm">{message.content}</p>
                    )}

                    {isPureAttachment && (
                        <p className="break-words text-sm italic text-gray-300">Attachment</p>
                    )}

                    {message.mediaUrl && message.mediaType === 'image' && (
                        <img
                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${message.mediaUrl}`}
                            alt="Attached Image"
                            className="max-w-xs max-h-48 rounded-lg mt-2 cursor-pointer"
                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL}${message.mediaUrl}`, '_blank')}
                        />
                    )}
                    {message.mediaUrl && message.mediaType === 'gif' && (
                        <img
                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${message.mediaUrl}`}
                            alt="Attached GIF"
                            className="max-w-xs max-h-48 rounded-lg mt-2 cursor-pointer"
                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL}${message.mediaUrl}`, '_blank')}
                        />
                    )}
                    {message.mediaUrl && message.mediaType === 'video' && (
                        <video
                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${message.mediaUrl}`}
                            controls
                            className="max-w-xs max-h-48 rounded-lg mt-2"
                        />
                    )}

                    <div className={`text-xs mt-1 ${isMyMessage ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                        {timestamp}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
