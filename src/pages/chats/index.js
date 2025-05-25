// frontend/pages/chats/index.js
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getChats, searchUsers, createChat, getMessagesForChat, sendMessage, markMessagesAsRead } from '../../lib/api';
import UserSearch from '../../components/UserSearch';
import ChatList from '../../components/ChatList';
import ChatWindow from '../../components/ChatWindow';
import useDebounce from '../../hooks/useDebounce'; // Import the new hook

const ChatsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const socket = useSocket();
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [message, setMessage] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);

  // Debounced search query for real-time search
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms debounce delay

  // Effect to check token on mount
  useEffect(() => {
    const testToken = localStorage.getItem('token');
    console.log('ChatsPage: useEffect - Token from localStorage on mount:', testToken);
    if (!testToken) {
      console.warn('ChatsPage: useEffect - No token found in localStorage on mount!');
    }
  }, []);

  // Callback to fetch chat list from API
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
      if (error.message.includes('token') || error.message.includes('403') || error.message.includes('401')) {
        localStorage.removeItem('token');
      }
    } finally {
      setLoadingChats(false);
    }
  }, []);

  // Callback to handle user search (this needs to be defined BEFORE the useEffect that uses it)
  const handleSearchSubmit = useCallback(async (query) => {
    if (!query) {
      setSearchResults([]); // This is good, clears if query is empty
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
      // Filter out the current user from search results
      const filteredResults = data.filter(u => u._id !== user?._id);
      console.log("Filtered Search Results:", filteredResults); // Add this log for debugging duplicates
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('ChatsPage: User search error:', error);
      setMessage(error.message || 'Failed to search users.');
    }
  }, [user]); // `user` is a dependency for filtering

  // Effect to trigger search on debounced query change
  // This must come AFTER handleSearchSubmit is defined
  useEffect(() => {
    // Only search if the debounced query is not empty and user is available
    if (debouncedSearchQuery && user) {
      handleSearchSubmit(debouncedSearchQuery);
    } else if (!debouncedSearchQuery) {
      setSearchResults([]); // Clear results if query is empty
    }
  }, [debouncedSearchQuery, handleSearchSubmit, user]); // Depend on debounced query, the handler, and user

  // Effect to load messages for the selected chat
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentChatId) {
        setMessages([]); // Clear messages if no chat is selected
        return;
      }
      setLoadingMessages(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('ChatsPage: loadMessages - No token found! Cannot fetch messages.');
          setLoadingMessages(false);
          return;
        }
        const chatMessages = await getMessagesForChat(currentChatId, token);
        setMessages(chatMessages);

        // Mark messages as read if there are any and current user is in the chat
        if (chatMessages.length > 0) {
            await markMessagesAsRead(currentChatId, token);
            // Update the specific chat's unreadCount in the chats state to 0 after marking as read
            setChats(prevChats =>
                prevChats.map(c =>
                    c._id === currentChatId ? { ...c, unreadCount: 0 } : c
                )
            );
        }

      } catch (error) {
        console.error('ChatsPage: Fetch messages error:', error);
        setMessage(error.message || 'Failed to load messages.');
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [currentChatId]); // Re-run when currentChatId changes

  // Effect to fetch chats when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log('ChatsPage: isAuthenticated is true, fetching chats...');
      fetchChats();
    } else {
      console.log('ChatsPage: isAuthenticated is false, not fetching chats.');
      setChats([]); // Clear chats if not authenticated
      setLoadingChats(false);
    }
  }, [isAuthenticated, fetchChats]); // `WorkspaceChats` is a dependency as it's a callback

  // --- Socket.IO specific useEffect for receiving messages and chat list updates ---
  useEffect(() => {
    if (socket && user) {
      console.log('ChatsPage: Socket.IO listener setup.');

      // Listener for when a message is received in the current chat
      const handleReceiveMessage = (newMessage) => {
        console.log('Socket: Received new message:', newMessage);

        // Update messages array for the currently selected chat
        if (selectedChat && newMessage.chat === selectedChat._id) {
          setMessages(prevMessages => {
            // Prevent adding duplicate optimistic messages by checking _id or temp-id
            const exists = prevMessages.some(
              msg => msg._id === newMessage._id ||
                     (msg.content === newMessage.content && msg.sender._id === newMessage.sender._id && msg._id.startsWith('temp-'))
            );
            if (exists) {
              console.log('Socket: Message already exists (or is optimistic duplicate), not adding to chat window:', newMessage);
              return prevMessages;
            }
            console.log('Socket: Adding new message to display:', newMessage);
            return [...prevMessages, newMessage];
          });

          // Mark as read immediately if the message is from another user and chat is open
          if (newMessage.sender._id !== user._id) {
            markMessagesAsRead(selectedChat._id, localStorage.getItem('token'));
          }
        }

        // --- Update chat list (for sidebar) when any message is received (for current chat OR other chats) ---
        setChats(prevChats => {
            let updatedChatFound = false;
            const newChats = prevChats.map(chat => {
                if (chat._id === newMessage.chat) {
                    updatedChatFound = true;
                    const isCurrentUserSender = newMessage.sender._id === user._id;
                    let newUnreadCount = chat.unreadCount;

                    // Increment unread count only if:
                    // 1. The message is NOT sent by the current user
                    // 2. The chat is NOT currently selected (i.e., it's a message for another chat)
                    if (!isCurrentUserSender && selectedChat?._id !== chat._id) {
                        newUnreadCount += 1;
                    } else {
                        // If current user sent it, or it's the active chat, reset unread count
                        newUnreadCount = 0;
                    }

                    return {
                        ...chat,
                        lastMessage: newMessage, // Update last message
                        updatedAt: newMessage.timestamp, // Update last activity time
                        unreadCount: newUnreadCount
                    };
                }
                return chat;
            });

            // Fallback: If the chat for the new message wasn't found in the current list (e.g., brand new chat not yet fetched)
            if (!updatedChatFound) {
                console.warn('Socket: Chat for new message not found in existing chats list. Refetching chats...');
                fetchChats(); // Refetch all chats to ensure new chat is included
                return prevChats; // Return old state for now, fetchChats will update it.
            }

            // Move the updated chat to the top and re-sort
            const chatToMove = newChats.find(c => c._id === newMessage.chat);
            const otherChats = newChats.filter(c => c._id !== newMessage.chat);
            return [chatToMove, ...otherChats].sort((a, b) => {
                const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
                const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
                return dateB.getTime() - dateA.getTime();
            });
        });
      };

      // Listener for general chat list updates (e.g., a message arrived for a chat not currently open)
      const handleChatListUpdate = (data) => {
        console.log('Socket: Chat list update received:', data);

        setChats(prevChats => {
            let updatedChatFound = false;
            const newChats = prevChats.map(chat => {
                if (chat._id === data.chatId) {
                    updatedChatFound = true;
                    const isCurrentUserSender = data.senderId === user._id;
                    let newUnreadCount = chat.unreadCount;

                    // Increment unread count only if the sender is NOT the current user
                    // AND the chat is NOT currently selected (i.e., message received for a different chat in sidebar)
                    if (!isCurrentUserSender && selectedChat?._id !== data.chatId) {
                        newUnreadCount += 1;
                    } else if (isCurrentUserSender || selectedChat?._id === data.chatId) {
                        // If current user sent it, or it's the active chat, ensure unread count is 0
                        newUnreadCount = 0;
                    }

                    return {
                        ...chat,
                        lastMessage: data.lastMessage,
                        updatedAt: data.lastMessage.timestamp,
                        unreadCount: newUnreadCount
                    };
                }
                return chat;
            });

            // Fallback: If the chat for the update wasn't found in the current list
            if (!updatedChatFound) {
                console.warn('Socket: Chat for chat_list_update not found in existing chats. Refetching chats...');
                fetchChats(); // Refetch all chats to ensure it's included
                return prevChats;
            }

            // Move the updated chat to the top and re-sort
            const chatToMove = newChats.find(c => c._id === data.chatId);
            const otherChats = newChats.filter(c => c._id !== data.chatId);
            return [chatToMove, ...otherChats].sort((a, b) => {
                const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
                const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
                return dateB.getTime() - dateA.getTime();
            });
        });
      };

      // Register Socket.IO event listeners
      socket.on('receive_message', handleReceiveMessage);
      socket.on('chat_list_update', handleChatListUpdate);

      // Join the specific chat room when selectedChat changes
      if (selectedChat) {
        socket.emit('join_chat', selectedChat._id);
        console.log(`Socket: Emitted join_chat for chat room: ${selectedChat._id}`);
      }

      // Join personal user room on mount/login
      if (user?._id) {
        socket.emit('join_chat', `user_${user._id}`);
        console.log(`Socket: Emitted join_chat for personal room: user_${user._id}`);
      }

      // Cleanup function to remove listeners when component unmounts or dependencies change
      return () => {
        console.log('ChatsPage: Socket.IO listener cleanup.');
        socket.off('receive_message', handleReceiveMessage);
        socket.off('chat_list_update', handleChatListUpdate);
      };
    }
  }, [socket, selectedChat, user, fetchChats, currentChatId]); // Dependencies for Socket.IO useEffect

  // Handler for search input changes (updates searchQuery state immediately)
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Callback to handle creating a new chat (private or group)
  const handleCreateChat = useCallback(async (participantIds, type = 'private', name = '') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('ChatsPage: handleCreateChat - No token found! Cannot create chat.');
        setMessage('Authentication required to create chats.');
        return;
      }
      // Ensure current user is included in participants
      const participants = [...participantIds];
      if (user?._id && !participants.includes(user._id)) {
        participants.push(user._id);
      }

      const newChatResponse = await createChat(participants, type, name, token);
      const newChat = newChatResponse.chat; // Extract chat object from response

      setChats(prevChats => {
        // If chat already exists (e.g., private chat), update it and move to top. Otherwise, add new.
        const existingChatIndex = prevChats.findIndex(chat => chat._id === newChat._id);
        let updatedChats;

        if (existingChatIndex > -1) {
          // Chat already exists, update its details and move it to top
          const existingChat = { ...prevChats[existingChatIndex], ...newChat, unreadCount: 0 }; // Ensure unread is 0 for newly selected/created
          updatedChats = [existingChat, ...prevChats.filter((_, i) => i !== existingChatIndex)];
        } else {
          // New chat, add it to the beginning with unreadCount 0
          updatedChats = [{ ...newChat, unreadCount: 0 }, ...prevChats];
        }

        // Sort to maintain correct order by updatedAt
        return updatedChats.sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
            const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
            return dateB.getTime() - dateA.getTime();
        });
      });
      setSelectedChat(newChat); // Select the newly created/found chat
      setCurrentChatId(newChat._id); // Update currentChatId to trigger message load
      setMessage('Chat created successfully!');
      setSearchResults([]); // Clear search results after chat creation
      setSearchQuery(''); // Clear search query input
    } catch (error) {
      console.error('ChatsPage: Create chat error:', error);
      setMessage(error.message || 'Failed to create chat.');
    }
  }, [user]); // `user` is a dependency for handling current user's ID

  // Handler for selecting a chat from the chat list
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setCurrentChatId(chat._id);
    setMessages([]); // Clear previous chat's messages before loading new ones
    // The `useEffect` dependent on `currentChatId` will handle fetching messages
    // and marking them as read.
  };

  // Callback to handle sending a message
  const handleSendMessage = useCallback(async (content) => {
    if (!selectedChat || !content.trim() || !user) return; // Basic validation

    let tempMessageId;
    let optimisticMessage;
    const originalLastMessage = selectedChat.lastMessage; // Store original for revert on error

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('ChatsPage: handleSendMessage - No token found! Cannot send message.');
        setMessage('Authentication required to send messages.');
        return;
      }

      // 1. Create an optimistic message for immediate UI update
      tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      optimisticMessage = {
        _id: tempMessageId,
        chat: selectedChat._id,
        sender: {
          _id: user._id,
          username: user.username,
          profilePicture: user.profilePicture
        },
        content: content,
        timestamp: new Date().toISOString(),
        readBy: [user._id] // Optimistically mark as read by sender
      };

      // Optimistically add message to chat window
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);

      // Optimistically update chat list for the sender (move to top, reset unread)
      setChats(prevChats => {
        let updatedChatFound = false;
        const newChats = prevChats.map(chat => {
          if (chat._id === selectedChat._id) {
            updatedChatFound = true;
            return {
              ...chat,
              lastMessage: optimisticMessage,
              updatedAt: optimisticMessage.timestamp,
              unreadCount: 0 // Sender's own active chat is always read
            };
          }
          return chat;
        });

        // Move the updated chat to the top and re-sort
        const chatToMove = newChats.find(c => c._id === selectedChat._id);
        const otherChats = newChats.filter(c => c._id !== selectedChat._id);
        if (chatToMove) {
          return [chatToMove, ...otherChats].sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
            const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
        }
        return newChats; // Fallback if chatToMove is undefined
      });

      // 2. Send message via REST API (backend will then emit via Socket.IO)
      const sentMessage = await sendMessage(selectedChat._id, content, token);
      console.log('[Frontend] Message sent successfully to backend (via REST API):', sentMessage);

      // 3. Replace optimistic message with server-returned one (which has a real _id and timestamp)
      setMessages(prevMessages =>
        prevMessages.map(msg => (msg._id === tempMessageId ? sentMessage : msg))
      );

      // 4. Re-confirm selectedChat's lastMessage/unreadCount (safe redundancy for optimistic update consistency)
      setSelectedChat(prevSelectedChat => {
        if (!prevSelectedChat || prevSelectedChat._id !== selectedChat._id) return prevSelectedChat;
        return {
          ...prevSelectedChat,
          lastMessage: sentMessage,
          updatedAt: sentMessage.timestamp,
          unreadCount: 0
        };
      });

    } catch (error) {
      console.error('ChatsPage: Send message error:', error);
      setMessage(error.message || 'Failed to send message.');

      // Revert optimistic changes on error
      if (tempMessageId) {
        setMessages(prevMessages => prevMessages.filter(msg => msg._id !== tempMessageId));
        setChats(prevChats => {
          const revertedChats = prevChats.map(chat => {
            if (chat._id === selectedChat._id) {
              return {
                ...chat,
                lastMessage: originalLastMessage, // Revert last message
                updatedAt: originalLastMessage?.timestamp || chat.createdAt, // Revert last activity time
                unreadCount: chat.unreadCount // Keep original unread count
              };
            }
            return chat;
          });
          // Re-sort the chats after reverting
          return revertedChats.sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
            const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
        });
      }
    }
  }, [selectedChat, user]); // Dependencies for `handleSendMessage`

  // Render authentication message if not authenticated
  if (!isAuthenticated) {
    return (
      <Layout title="Redirecting...">
        <div className="flex justify-center items-center h-screen">
          <p className="text-xl text-blue-500">Please log in to view chats.</p>
        </div>
      </Layout>
    );
  }

  // Main component render
  return (
    <Layout title="Chats">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left pane: User Search and Chat List */}
        <div className="w-1/3 border-r border-gray-700 bg-gray-800 p-4 flex flex-col">
          <h2 className="text-2xl font-semibold mb-4 text-white">Chats</h2>
          {message && (
            <div className={`p-2 mb-4 rounded-md ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}

          <div className="mb-4">
            <UserSearch
              query={searchQuery}
              onSearchChange={handleSearchChange}
              // Form's onSubmit is now just preventing default, search logic handled by useEffect
              onSearchSubmit={(e) => { e.preventDefault(); }}
              searchResults={searchResults}
              onCreateChat={handleCreateChat}
            />
            {/* Display search results if available */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                {searchResults.map(resultUser => (
                  <div key={resultUser._id} className="p-2 border-b border-gray-600 last:border-b-0 hover:bg-gray-600 cursor-pointer flex justify-between items-center">
                    {/* CSS for truncating long usernames/emails */}
                    <div className="flex flex-col min-w-0 mr-2"> {/* Added a div to contain and constrain text */}
                        <span className="text-white font-medium truncate">{resultUser.username}</span>
                        <span className="text-gray-400 text-sm truncate">{resultUser.email}</span>
                    </div>
                    {user && user._id && resultUser._id !== user._id && (
                        <button
                          onClick={() => handleCreateChat([resultUser._id])}
                          className="flex-shrink-0 ml-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                          Chat
                        </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat List display */}
          {loadingChats ? (
            <p className="text-center text-gray-500">Loading chats...</p>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
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