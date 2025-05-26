// frontend/pages/chats/index.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import { getChats, getUserProfile, createChat, sendMessage, getMessagesForChat, searchUsers, markMessagesAsRead } from '../../lib/api';
import ChatWindow from '../../components/ChatWindow';
import UserSearch from '../../components/UserSearch'; // <--- IMPORT YOUR USERSEARCH
import Notification from '../../components/Notification';
// No specific CSS module for ChatsPage, assuming Tailwind is global or applied via global.css
// import styles from '../../styles/ChatsPage.module.css'; // REMOVE if using Tailwind directly

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'; // Socket.IO connects to the base URL

const ChatsPage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info');
  const [showNotification, setShowNotification] = useState(false);

  // States specific to your UserSearch component
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  // No need for showUserSearch, selectedUsersForNewChat, newGroupChatName as they are handled internally by UserSearch

  const socket = useRef(null);

  // --- Notification Logic ---
  const displayNotification = useCallback((msg, type = 'info') => {
    setMessage(msg);
    setNotificationType(type);
    setShowNotification(true);
    const timer = setTimeout(() => {
      setShowNotification(false);
      setMessage('');
    }, 5000);
    return () => clearTimeout(timer); // Clean up timer
  }, []);

  // --- Auth & Initial Data Fetching ---
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);

    const fetchUserProfileAndChats = async () => {
      try {
        const userProfile = await getUserProfile(storedToken);
        setUser(userProfile);
        displayNotification(`Welcome, ${userProfile.username}!`, 'success');

        const initialChats = await getChats(storedToken);
        setChats(initialChats);
        setLoadingChats(false);
      } catch (error) {
        console.error('Failed to fetch user data or chats:', error);
        displayNotification(error.message || 'Failed to load data. Please log in again.', 'error');
        localStorage.removeItem('token');
        router.push('/login');
      }
    };
    fetchUserProfileAndChats();
  }, [router, displayNotification]);

  // --- Socket.IO Setup ---
  useEffect(() => {
    if (!user || !token) return;

    socket.current = io(SOCKET_URL, {
      query: { token },
      transports: ['websocket', 'polling'],
    });

    socket.current.on('connect', () => {
      console.log('Socket.IO connected:', socket.current.id);
      socket.current.emit('register_user', user._id);
    });

    socket.current.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    socket.current.on('receive_message', (newMessage) => {
      console.log('Received new message:', newMessage);
      setMessages(prevMessages => {
        if (currentChat && newMessage.chat === currentChat._id) {
          return [...prevMessages, newMessage];
        }
        return prevMessages;
      });

      setChats(prevChats =>
        prevChats.map(chat => {
          if (chat._id === newMessage.chat) {
            let newUnreadCount = chat.unreadCount;
            if (newMessage.sender._id !== user._id && !(currentChat && currentChat._id === chat._id)) {
              newUnreadCount += 1;
            }
            return {
              ...chat,
              lastMessage: {
                sender: newMessage.sender,
                content: newMessage.content,
                timestamp: newMessage.timestamp
              },
              unreadCount: newUnreadCount,
              updatedAt: newMessage.timestamp
            };
          }
          return chat;
        })
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    });

    socket.current.on('chatCreated', (newChatData) => {
      console.log('New chat created/received:', newChatData);
      setChats(prevChats => {
        if (!prevChats.some(chat => chat._id === newChatData._id)) {
          return [newChatData, ...prevChats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }
        return prevChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
      displayNotification(`New chat: ${newChatData.name || 'Private Chat'}`, 'info');
    });

    socket.current.on('group_members_updated', (updatedChatData) => {
      console.log('Group members updated:', updatedChatData);
      setChats(prevChats =>
        prevChats.map(chat =>
          chat._id === updatedChatData._id ? updatedChatData : chat
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
      if (currentChat && currentChat._id === updatedChatData._id) {
        setCurrentChat(updatedChatData);
        displayNotification(updatedChatData.lastMessage?.content || 'Group members updated.', 'info');
      }
    });

    socket.current.on('chatDeleted', (deletedChatId) => {
      console.log('Chat deleted:', deletedChatId);
      setChats(prevChats => prevChats.filter(chat => chat._id !== deletedChatId));
      if (currentChat && currentChat._id === deletedChatId) {
        setCurrentChat(null);
        setCurrentChatId(null);
        setMessages([]);
        displayNotification('You have been removed from the chat.', 'warning');
      } else {
        displayNotification('A chat was deleted.', 'warning');
      }
    });

    return () => {
      if (socket.current) {
        socket.current.off('connect');
        socket.current.off('disconnect');
        socket.current.off('receive_message');
        socket.current.off('chatCreated');
        socket.current.off('group_members_updated');
        socket.current.off('chatDeleted');
        socket.current.disconnect();
      }
    };
  }, [user, token, currentChat, displayNotification]);

  // --- Load Messages for Current Chat ---
  const loadMessages = useCallback(async (chatIdToLoad) => {
    if (!chatIdToLoad || !token) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const chatMessages = await getMessagesForChat(chatIdToLoad, token);
      setMessages(chatMessages);
      await markMessagesAsRead(chatIdToLoad, token);
      setChats(prevChats =>
        prevChats.map(c =>
          c._id === chatIdToLoad ? { ...c, unreadCount: 0 } : c
        )
      );
      setCurrentChat(prevChat =>
        prevChat && prevChat._id === chatIdToLoad ? { ...prevChat, unreadCount: 0 } : prevChat
      );
    } catch (error) {
      console.error('Fetch messages error:', error);
      displayNotification(error.message || 'Failed to load messages.', 'error');
    } finally {
      setLoadingMessages(false);
    }
  }, [token, displayNotification]);

  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    }
  }, [currentChatId, loadMessages]);

  // --- Chat Selection Handler ---
  const handleChatSelect = useCallback((chat) => {
    setCurrentChat(chat);
    setCurrentChatId(chat._id);
    if (socket.current) {
      // If there was a previously selected chat, tell the server to leave that room
      // The server-side will handle if the socket is actually in that room or not.
      if (currentChatId) { // Check if a previous chat was selected
        socket.current.emit('leave_chat', currentChatId);
      }
      // Tell the server to join the new chat's room
      socket.current.emit('join_chat', chat._id);
    }
  }, [currentChatId]);

  // --- Message Sending ---
  const handleSendMessage = useCallback(async (chatId, content) => {
    try {
      await sendMessage(chatId, content, token);
    } catch (error) {
      console.error('Send message error:', error);
      displayNotification(error.message || 'Failed to send message.', 'error');
    }
  }, [token, displayNotification]);

  // --- User Search & Create Chat from UserSearch component ---
  const handleSearchInputChange = useCallback(async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await searchUsers(query, token);
      // Filter out self from search results
      const filtered = data.filter(u => u._id !== user._id);
      setSearchResults(filtered);
    } catch (error) {
      console.error('User search error:', error);
      displayNotification(error.message || 'Failed to search users.', 'error');
    }
  }, [token, user, displayNotification]);


  // THIS IS THE UNIVERSAL onCreateChat function called by UserSearch
  const handleCreateNewChatFromUserSearch = useCallback(async (participantIds, type, name = '', existingChatId = null) => {
    // If existingChatId is provided (from private chat check), just select it
    if (existingChatId) {
      const foundChat = chats.find(c => c._id === existingChatId);
      if (foundChat) {
          handleChatSelect(foundChat);
          return;
      }
    }

    // Add current user to participants list for API call if not already included
    if (!participantIds.includes(user._id)) {
      participantIds.push(user._id);
    }

    try {
      const result = await createChat(participantIds, type, name, token);
      displayNotification(result.message || `${type === 'group' ? 'Group' : 'Private'} chat created successfully!`, 'success');

      // The `chatCreated` socket event will handle adding it to the list
      // and we can select it here after the socket processes it.
      // For now, let's just make sure it's the current chat.
      setChats(prevChats => {
        const updatedChats = [result.chat, ...prevChats.filter(c => c._id !== result.chat._id)];
        return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
      handleChatSelect(result.chat); // Select the newly created/found chat
      setSearchQuery(''); // Clear search bar after creation
      setSearchResults([]); // Clear search results

    } catch (error) {
      console.error('Create chat error:', error);
      displayNotification(error.message || 'Failed to create chat.', 'error');
    }
  }, [chats, user, token, displayNotification, handleChatSelect]); // Include chats in dependency array

  // Handle re-fetching chat details after group member changes
  const handleChatWindowUpdate = useCallback(async (chatId) => {
    if (!token) return;
    try {
        const updatedChats = await getChats(token);
        setChats(updatedChats);
        const updatedCurrentChat = updatedChats.find(c => c._id === chatId);
        if (updatedCurrentChat) {
            setCurrentChat(updatedCurrentChat);
        }
    } catch (error) {
        console.error('Error re-fetching chats after update:', error);
        displayNotification('Failed to refresh chat list.', 'error');
    }
  }, [token, displayNotification]);


  if (!user || loadingChats) {
    return <div className="flex justify-center items-center h-screen text-lg text-gray-700">Loading chat page...</div>;
  }

  return (
    // Replaced styles.chatsPage with Tailwind classes
    <div className="flex h-screen bg-gray-100 font-sans">
      {showNotification && (
        <Notification
          message={message}
          type={notificationType}
          onClose={() => setShowNotification(false)}
        />
      )}

      {/* Replaced styles.chatSidebar with Tailwind classes */}
      <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col p-4 shadow-lg overflow-y-auto">
        {/* Replaced styles.sidebarHeader with Tailwind classes */}
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-700">
          <h3 className="text-white text-xl font-semibold">Welcome, {user.username}!</h3>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/login');
            }}
            // Replaced styles.logoutButton with Tailwind classes
            className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* User Search Component */}
        <div className="mb-4">
          <UserSearch
            query={searchQuery}
            onSearchChange={handleSearchInputChange}
            searchResults={searchResults}
            onCreateChat={handleCreateNewChatFromUserSearch}
            chats={chats} // Pass existing chats to UserSearch for private chat check
            currentUser={user} // Pass current user for private chat check
            showNotification={displayNotification} // Pass notification handler
          />
        </div>

        {/* Replaced styles.chatList with Tailwind classes */}
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {chats.length === 0 && !loadingChats ? (
            <p className="text-center text-gray-400 p-5">No chats yet. Start a new one!</p>
          ) : (
            chats.map(chat => {
              let chatDisplayName = chat.name;
              let chatDisplayImage = '/default-group-avatar.png';

              if (chat.type === 'private' && chat.recipient) {
                chatDisplayName = chat.recipient.username;
                chatDisplayImage = chat.recipient.profilePicture || '/default-avatar.png';
              } else if (chat.type === 'private' && chat.participants.length === 1 && chat.participants[0]._id === user._id) {
                chatDisplayName = `${user.username} (You)`;
                chatDisplayImage = user.profilePicture || '/default-avatar.png';
              }

              return (
                // Replaced styles.chatListItem and styles.activeChat with Tailwind classes
                <div
                  key={chat._id}
                  onClick={() => handleChatSelect(chat)}
                  className={`flex items-center p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors relative
                    ${currentChatId === chat._id ? 'bg-gray-700 border-l-4 border-blue-500' : ''}`}
                >
                  {/* Replaced styles.chatAvatar with Tailwind classes */}
                  <img src={chatDisplayImage} alt={chatDisplayName} className="w-12 h-12 rounded-full mr-4 object-cover border border-gray-600" />
                  {/* Replaced styles.chatInfo with Tailwind classes */}
                  <div className="flex-grow flex flex-col min-w-0">
                    {/* Replaced styles.chatName with Tailwind classes */}
                    <span className="font-semibold text-white truncate">{chatDisplayName}</span>
                    {chat.lastMessage && (
                      // Replaced styles.lastMessage with Tailwind classes
                      <span className="text-sm text-gray-400 truncate">
                        {chat.lastMessage.sender._id === user._id ? 'You: ' : `${chat.lastMessage.sender.username}: `}
                        {chat.lastMessage.content}
                      </span>
                    )}
                  </div>
                  {chat.unreadCount > 0 && (
                    // Replaced styles.unreadBadge with Tailwind classes
                    <span className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs font-bold absolute top-2 right-2 min-w-[24px] text-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Replaced styles.chatMain with Tailwind classes */}
      <main className="flex-grow flex flex-col bg-gray-900">
        <ChatWindow
          currentChat={currentChat}
          messages={messages}
          user={user}
          onSendMessage={handleSendMessage}
          loadingMessages={loadingMessages}
          showNotification={displayNotification}
          token={token}
          onChatUpdate={handleChatWindowUpdate}
        />
      </main>
    </div>
  );
};

export default ChatsPage;