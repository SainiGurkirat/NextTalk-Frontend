// frontend/pages/chats/index.js
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { getChats, searchUsers, createChat, getMessagesForChat } from '../../lib/api';
import UserSearch from '../../components/UserSearch';
import ChatList from '../../components/ChatList';
import ChatWindow from '../../components/ChatWindow';

const ChatsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [message, setMessage] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // --- DEBUG LOGS FOR TOKEN RETRIEVAL ---
  useEffect(() => {
    const testToken = localStorage.getItem('token');
    console.log('ChatsPage: useEffect - Token from localStorage on mount:', testToken);
    if (!testToken) {
      console.warn('ChatsPage: useEffect - No token found in localStorage on mount!');
    }
  }, []);

  const fetchChats = useCallback(async () => {
    setLoadingChats(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      console.log('ChatsPage: fetchChats - Token retrieved for API call:', token);
      if (!token) {
        console.error('ChatsPage: fetchChats - No token found! Cannot fetch chats.');
        setMessage('Authentication required to view chats.');
        setLoadingChats(false);
        return;
      }
      const data = await getChats(token);
      setChats(data);
    } catch (error) {
      console.error('ChatsPage: Fetch chats error:', error);
      setMessage(error.message || 'Failed to load chats.');
      if (error.message === 'Invalid token' || error.message.includes('403')) {
          localStorage.removeItem('token');
      }
    } finally {
      setLoadingChats(false);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!selectedChat || !selectedChat._id) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('ChatsPage: fetchMessages - No token found! Cannot fetch messages.');
        setLoadingMessages(false);
        return;
      }
      const chatMessages = await getMessagesForChat(selectedChat._id, token);
      setMessages(chatMessages);
    } catch (error) {
      console.error('ChatsPage: Fetch messages error:', error);
      setMessage(error.message || 'Failed to load messages.');
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('ChatsPage: isAuthenticated is true, fetching chats...');
      fetchChats();
    } else {
      console.log('ChatsPage: isAuthenticated is false, not fetching chats.');
      setChats([]);
      setLoadingChats(false);
    }
  }, [isAuthenticated, fetchChats]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);


  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = useCallback(async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      console.log('ChatsPage: handleSearchSubmit - Token retrieved for searchUsers:', token);
      if (!token) {
        console.error('ChatsPage: handleSearchSubmit - No token found! Cannot search users.');
        return;
      }
      const data = await searchUsers(query, token);
      setSearchResults(data.filter(u => u._id !== user?._id)); // Use _id from user object
    } catch (error) {
      console.error('ChatsPage: User search error:', error);
      setMessage(error.message || 'Failed to search users.');
    }
  }, [user]);

  const handleCreateChat = useCallback(async (participantIds, type = 'private', name = '') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('ChatsPage: handleCreateChat - No token found! Cannot create chat.');
        return;
      }
      const participants = [...participantIds];
      if (user?._id && !participants.includes(user._id)) { // Use _id for consistency
        participants.push(user._id);
      }

      const newChat = await createChat(participants, type, name, token);
      setChats(prevChats => [...prevChats, newChat]);
      setSelectedChat(newChat);
      setMessage('Chat created successfully!');
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('ChatsPage: Create chat error:', error);
      setMessage(error.message || 'Failed to create chat.');
    }
  }, [user]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
  };

  const handleSendMessage = useCallback(async (content) => {
    if (!selectedChat || !content.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('ChatsPage: handleSendMessage - No token found!');
        return;
      }
      const newMessage = {
        _id: Date.now().toString(),
        chat: selectedChat._id,
        sender: {
          _id: user._id, // Use _id for current user
          username: user.username,
        },
        content: content,
        timestamp: new Date().toISOString(),
      };
      setMessages(prevMessages => [...prevMessages, newMessage]);
      // TODO: Call your actual API/Socket send here.
      // Example: await sendMessage(selectedChat._id, content, token);
      console.log(`[Frontend] Sending message: "${content}" to chat ${selectedChat._id}`);

    } catch (error) {
      console.error('ChatsPage: Send message error:', error);
      setMessage('Failed to send message.');
    }
  }, [selectedChat, user]);


  if (!isAuthenticated) {
    return (
      <Layout title="Redirecting...">
        <div className="flex justify-center items-center h-screen">
          <p className="text-xl text-blue-500">Please log in to view chats.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Chats">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left pane: User Search and Chat List */}
        <div className="w-1/3 border-r border-gray-700 bg-gray-800 p-4 flex flex-col">
          <h2 className="text-2xl font-semibold mb-4 text-white">Chats</h2> {/* Changed to white */}
          {message && (
            <div className={`p-2 mb-4 rounded-md ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}

          <div className="mb-4">
            <UserSearch
              query={searchQuery}
              onSearchChange={handleSearchChange}
              onSearchSubmit={(e) => {
                e.preventDefault();
                handleSearchSubmit(searchQuery);
              }}
              searchResults={searchResults}
              onCreateChat={handleCreateChat}
            />
            {searchResults.length > 0 && (
              <div className="mt-2 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                {searchResults.map(resultUser => (
                  <div key={resultUser._id} className="p-2 border-b border-gray-600 last:border-b-0 hover:bg-gray-600 cursor-pointer flex justify-between items-center">
                    <span className="text-white">{resultUser.username}</span>
                    <span className="text-gray-400 ml-2 text-sm">({resultUser.email})</span>
                    {user && user._id && resultUser._id !== user._id && (
                        <button
                            onClick={() => handleCreateChat([resultUser._id])}
                            className="ml-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            Chat
                        </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {loadingChats ? (
            <p className="text-center text-gray-500">Loading chats...</p>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar"> {/* Added wrapper div for flex */}
              <ChatList chats={chats} onSelectChat={handleSelectChat} selectedChatId={selectedChat?._id} currentUser={user} />
            </div>
          )}
        </div>

        {/* Right pane for Chat Window */}
        <div className="w-2/3 flex flex-col bg-gray-900">
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              messages={messages}
              onSendMessage={handleSendMessage}
              currentUser={user}
              loadingMessages={loadingMessages}
            />
          ) : (
            <div className="flex justify-center items-center h-full text-gray-500 text-xl">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatsPage;