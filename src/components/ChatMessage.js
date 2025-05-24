const ChatMessage = ({ message, currentUserId }) => {
  const isSender = message.sender._id === currentUserId;
  const messageClass = isSender ? 'bg-primary text-white self-end rounded-br-none' : 'bg-gray-200 text-text self-start rounded-bl-none';

  const timestamp = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex flex-col mb-2 ${isSender ? 'items-end' : 'items-start'}`}>
      <div className={`p-3 rounded-xl max-w-[70%] ${messageClass} shadow-sm`}>
        {!isSender && (
          <div className="font-semibold text-sm mb-1">
            {message.sender.username}
          </div>
        )}
        <p className="text-sm break-words">{message.content}</p>
        <span className={`text-xs mt-1 ${isSender ? 'text-white/80' : 'text-gray-500'} block text-right`}>
          {timestamp}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;


