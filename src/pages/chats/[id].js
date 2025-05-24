import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import ChatMessage from '../../components/ChatMessage';
import ChatInput from '../../components/ChatInput';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getChatMessages } from '../../lib/api';

const ChatPage = () => {
  const router = useRouter();
  const { id: chatId } = router.query; // Get chat ID from URL
  const { user, loading: authLoading, logout } = useAuth();
  const { socket, isConnected } = useSocket();

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState({}); // { username: true/false }
  const messagesEndRef = useRef(null); // Ref for auto-scrolling

  const fetchMessages = async () => {
    if (!chatId || !user) return;
    setLoadingMessages(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const fetchedMessages = await getChatMessages(chatId, token);
      setMessages(fetchedMessages);
    } catch (err) {
      setError('Failed to load messages. Please try again.');
      console.error('Fetch messages error:', err);
      if (err.message.includes('Access denied') || err.message.includes('Invalid or expired token')) {
        logout(); // Redirect to login if unauthorized
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/'); // Redirect to login if not authenticated
      return;
    }

    fetchMessages();

    if (socket && isConnected && chatId && user) {
      socket.emit('joinChat', chatId);

      const handleReceiveMessage = (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        // Remove typing indicator for the sender if they sent a message
        setTypingUsers((prev) => {
            const newTyping = { ...prev };
            if (newTyping[newMessage.sender.username]) {
                delete newTyping[newMessage.sender.username];
            }
            return newTyping;
        });
      };

      const handleUserTyping = (data) => {
        if (data.chatId === chatId && data.username !== user.username) {
          setTypingUsers((prev) => ({ ...prev, [data.username]: true }));
        }
      };

      const handleUserStoppedTyping = (data) => {
        if (data.chatId === chatId && data.username !== user.username) {
          setTypingUsers((prev) => {
            const newTyping = { ...prev };
            delete newTyping[data.username];
            return newTyping;
          });
        }
      };

      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('userTyping', handleUserTyping); // This event will be emitted as 'userTyping' from backend
      socket.on('userStoppedTyping', handleUserStoppedTyping); // This event will be emitted as 'userStoppedTyping' from backend

      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('userTyping', handleUserTyping);
        socket.off('userStoppedTyping', handleUserStoppedTyping);
        socket.emit('leaveChat', chatId); // Optional: inform server user left chat
      };
    }
  }, [chatId, user, authLoading, socket, isConnected, router, logout]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUsers]);

  const handleSendMessage = (content) => {
    if (socket && isConnected && user && chatId) {
      socket.emit('sendMessage', {
        chatId,
        senderId: user.id,
        content,
        type: 'text', // For now, only text messages
      });
    } else {
      setError('Socket not connected. Cannot send message.');
    }
  };

  const handleTyping = (isTyping) => {
    if (socket && isConnected && user && chatId) {
      if (isTyping) {
        socket.emit('typing', { chatId, username: user.username });
      } else {
        // This is a custom event name for stopping typing,
        // Backend needs to handle 'typing' with a timeout or a separate 'stoppedTyping' event.
        // For simplicity, current backend just emits 'userTyping' when someone starts.
        // The frontend manages the timeout for clearing its own typing indicator.
      }
    }
  };

  const typingUsernames = Object.keys(typingUsers).filter(username => typingUsers[username]);

  if (authLoading || !user || loadingMessages) {
    return (
      <Layout title="Loading Chat...">
        <div className="flex justify-center items-center h-screen">
          <p className="text-xl text-primary">Loading chat...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Chat Error">
        <div className="flex justify-center items-center h-screen flex-col">
          <p className="text-xl text-red-500 mb-4">{error}</p>
          <button onClick={() => router.push('/chats')} className="bg-primary hover:bg-secondary text-white py-2 px-4 rounded-md">
            Go to Chats List
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Chat with ${chatId}`}>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => router.push('/chats')}
          className="bg-gray-200 hover:bg-gray-300 text-text font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out"
        >
          &larr; Back to Chats
        </button>
        <h1 className="text-2xl font-bold text-primary">Chat</h1>
        <span className="text-lightText">Logged in as: <span className="font-semibold">{user.username}</span></span>
      </div>

      <div className="flex flex-col h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg p-4 overflow-y-auto custom-scrollbar">
        {messages.length === 0 ? (
          <p className="text-center text-lightText mt-auto mb-auto">Start the conversation!</p>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg._id} message={msg} currentUserId={user.id} />
          ))
        )}
        <div ref={messagesEndRef} /> {/* Scroll target */}
      </div>

      {typingUsernames.length > 0 && (
        <div className="text-sm text-lightText mt-2 ml-2">
          {typingUsernames.join(', ')} {typingUsernames.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      <ChatInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
    </Layout>
  );
};

export default ChatPage;