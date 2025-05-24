import Link from 'next/link';

const ChatList = ({ chats, currentUserId }) => {
  if (!chats || chats.length === 0) {
    return <p className="text-lightText text-center mt-8">No chats found. Start a new conversation!</p>;
  }

  return (
    <div className="space-y-4">
      {chats.map((chat) => {
        const otherParticipant = chat.participants.find(p => p._id !== currentUserId);
        const chatName = chat.type === 'group' ? chat.name : (otherParticipant ? otherParticipant.username : 'Unknown User');
        const lastMessageContent = chat.lastMessage?.content || 'No messages yet.';
        const lastMessageTime = chat.lastMessage?.timestamp ? new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        return (
          <Link href={`/chats/${chat._id}`} key={chat._id} className="block">
            <div className="flex items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl font-semibold text-gray-600 mr-4">
                {chatName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text">{chatName}</h3>
                <p className="text-lightText text-sm truncate">{lastMessageContent}</p>
              </div>
              {lastMessageTime && (
                <span className="text-xs text-gray-400 ml-4">{lastMessageTime}</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default ChatList;