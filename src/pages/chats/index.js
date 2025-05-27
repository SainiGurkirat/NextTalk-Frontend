// frontend/pages/chats/index.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import { getChats, getUserProfile, createChat, getMessagesForChat, searchUsers, markMessagesAsRead } from '../../lib/api';
import ChatWindow from '../../components/ChatWindow';
import UserSearch from '../../components/UserSearch';
import Notification from '../../components/Notification';
import ChatList from '../../components/ChatList';
import { set } from 'date-fns';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const ChatsPage = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [chats, setChats] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [currentChatId, setCurrentChatId] = useState(null); // Used to trigger message loading
    const [messages, setMessages] = useState([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('info');
    const [showNotification, setShowNotification] = useState(false);

    // States specific to your UserSearch component in sidebar
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // States for group chat creation
    const [isCreatingGroupChat, setIsCreatingGroupChat] = useState(false);
    const [selectedUsersForGroupChat, setSelectedUsersForGroupChat] = useState([]);
    const [newGroupChatName, setNewGroupChatName] = useState('');

    const socket = useRef(null);
    const currentChatRef = useRef(currentChat); // Ref to hold the latest currentChat state

    // --- Update currentChatRef whenever currentChat state changes ---
    useEffect(() => {
        currentChatRef.current = currentChat;
        console.log('[FRONTEND DEBUG] currentChat state updated (ref):', currentChat ? currentChat._id : 'null');
    }, [currentChat]); // This useEffect solely keeps the ref updated

    // --- Notification Logic ---
    const displayNotification = useCallback((msg, type = 'info') => {
        setNotificationMessage(msg);
        setNotificationType(type);
        setShowNotification(true);
        const timer = setTimeout(() => {
            setShowNotification(false);
            setNotificationMessage('');
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    // --- Auth & Initial Data Fetching ---
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
            console.log('[AUTH] No token found, redirecting to Home.');
            router.push('/');
            return;
        }
        setToken(storedToken);

        const fetchUserProfileAndChats = async () => {
            try {
                console.log('[INIT] Fetching user profile...');
                const userProfile = await getUserProfile(storedToken);
                setUser(userProfile);
                displayNotification(`Welcome, ${userProfile.username}!`, 'success');
                console.log('[INIT] User profile fetched:', userProfile.username);

                console.log('[INIT] Fetching initial chats...');
                const initialChats = await getChats(storedToken);
                setChats(initialChats);
                setLoadingChats(false);
                console.log('[INIT] Initial chats fetched:', initialChats.length);

                // Handle initial chat selection from URL query if present
                if (router.query.chatId) {
                    const chatFromUrl = initialChats.find(c => c._id === router.query.chatId);
                    if (chatFromUrl) {
                        handleChatSelect(chatFromUrl);
                    }
                }

            } catch (error) {
                console.error('[INIT ERROR] Failed to fetch user data or chats:', error);
                displayNotification(error.message || 'Failed to load data. Please log in again.', 'error');
                localStorage.removeItem('token');
                router.push('/login');
            }
        };
        fetchUserProfileAndChats();
    }, [router, displayNotification]);

    // --- Socket.IO Setup ---
    useEffect(() => {
        if (!user || !token) {
            console.log('[SOCKET] Skipping socket setup: user or token missing.');
            return;
        }

        console.log('[SOCKET] Initializing Socket.IO connection...');
        socket.current = io(SOCKET_URL, {
            query: { token },
            transports: ['websocket', 'polling'],
        });

        socket.current.on('connect', () => {
            console.log('Socket.IO connected:', socket.current.id);
            socket.current.emit('register_user', user._id);
            console.log(`[SOCKET] Emitted 'register_user' for user ID: ${user._id}`);
            // Join all active chat rooms on connect
            // Using chatsRef.current to avoid adding 'chats' to dependency array
            if (chats.length > 0) { // Check if chats has data before iterating
                 chats.forEach(chat => {
                    socket.current.emit('join_chat', chat._id);
                });
            }
        });

        socket.current.on('disconnect', () => {
            console.log('Socket.IO disconnected');
        });

        socket.current.on('receive_message', (newMessage) => {
            console.log('[FRONTEND] Received new message via socket:', newMessage);
            const latestCurrentChat = currentChatRef.current;

            // Ensure sender is populated for display, especially for self-sent messages
            // Backend should ideally send populated sender, but client-side fallback is good
            if (newMessage.sender && typeof newMessage.sender === 'string') {
                if (newMessage.sender === user._id) {
                    newMessage.sender = user;
                } else if (latestCurrentChat) {
                    const participant = latestCurrentChat.participants.find(p => p._id === newMessage.sender);
                    if (participant) {
                        newMessage.sender = participant;
                    }
                }
            } else if (!newMessage.sender && newMessage.senderId === user._id) { // Fallback if sender isn't populated at all
                newMessage.sender = user;
            }


            setMessages(prevMessages => {
                if (latestCurrentChat && newMessage.chat === latestCurrentChat._id) {
                    // Prevent duplicate messages if already added
                    if (!prevMessages.some(msg => msg._id === newMessage._id)) {
                        return [...prevMessages, newMessage];
                    }
                }
                return prevMessages;
            });

            // Update chats list (for sidebar preview, unread counts)
            setChats(prevChats => {
                const updatedChats = prevChats.map(chat => {
                    if (chat._id === newMessage.chat) {
                        let newUnreadCount = chat.unreadCount;
                        // Increment unread count only if message is from someone else AND chat is not currently open
                        if (newMessage.sender._id !== user._id && !(latestCurrentChat && latestCurrentChat._id === chat._id)) {
                            newUnreadCount = (newUnreadCount || 0) + 1;
                            displayNotification(`New message in ${chat.name || newMessage.sender.username || 'a chat'}`, 'info');
                        }

                        return {
                            ...chat,
                            lastMessage: {
                                sender: newMessage.sender,
                                content: newMessage.content,
                                timestamp: newMessage.createdAt
                            },
                            unreadCount: newUnreadCount,
                            updatedAt: newMessage.createdAt
                        };
                    }
                    return chat;
                })
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                return updatedChats;
            });
        });

        socket.current.on('chatCreated', (newChatData) => {
            console.log('[SOCKET] New chat created/received:', newChatData);
            setChats(prevChats => {
                if (!prevChats.some(chat => chat._id === newChatData._id)) {
                    const updated = [newChatData, ...prevChats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    return updated;
                }
                const sorted = prevChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                return sorted;
            });
            // If the user is a participant of the new chat, join its room
            if (newChatData.participants.some(p => p._id === user._id || p === user._id)) {
                socket.current.emit('join_chat', newChatData._id);
            }
            displayNotification(`New chat: ${newChatData.name || 'Private Chat'}`, 'info');
        });

        socket.current.on('chatUpdated', (updatedChatData) => {
            console.log('[SOCKET] Chat updated via socket:', updatedChatData);
            setChats(prevChats => {
                const updated = prevChats.map(chat =>
                    chat._id === updatedChatData._id ? {
                        ...chat,
                        lastMessage: updatedChatData.lastMessage || chat.lastMessage,
                        updatedAt: updatedChatData.updatedAt || chat.updatedAt,
                        name: updatedChatData.name || chat.name,
                        participants: updatedChatData.participants || chat.participants,
                        // Ensure unreadCount is preserved or updated if the server sends it
                        unreadCount: updatedChatData.unreadCount !== undefined ? updatedChatData.unreadCount : chat.unreadCount,
                    } : chat
                ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                return updated;
            });

            // If the currently selected chat is the one updated, make sure currentChat also reflects it
            setCurrentChat(prevChat => {
                if (prevChat && prevChat._id === updatedChatData._id) {
                    return {
                        ...prevChat,
                        lastMessage: updatedChatData.lastMessage || prevChat.lastMessage,
                        updatedAt: updatedChatData.updatedAt || prevChat.updatedAt,
                        name: updatedChatData.name || prevChat.name,
                        participants: updatedChatData.participants || prevChat.participants,
                        unreadCount: updatedChatData.unreadCount !== undefined ? updatedChatData.unreadCount : prevChat.unreadCount,
                    };
                }
                return prevChat;
            });
        });

        socket.current.on('group_members_updated', (updatedChatData) => {
            console.log('[SOCKET] Group members updated:', updatedChatData);
            setChats(prevChats =>
                prevChats.map(chat =>
                    chat._id === updatedChatData._id ? updatedChatData : chat
                ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            );
            if (currentChatRef.current && currentChatRef.current._id === updatedChatData._id) {
                setCurrentChat(updatedChatData);
                displayNotification(updatedChatData.lastMessage?.content || 'Group members updated.', 'info');
            }
        });

        socket.current.on('chatDeleted', (deletedChatId) => {
            console.log('[SOCKET] Chat deleted:', deletedChatId);
            setChats(prevChats => {
                const filtered = prevChats.filter(chat => chat._id !== deletedChatId);
                return filtered;
            });
            if (currentChatRef.current && currentChatRef.current._id === deletedChatId) {
                setCurrentChat(null);
                setCurrentChatId(null);
                setMessages([]);
                displayNotification('You have been removed from the chat or chat was deleted.', 'warning');
            } else {
                displayNotification('A chat was deleted.', 'warning');
            }
        });

        socket.current.on('chatRead', ({ chatId }) => {
            console.log(`[SOCKET] Received chatRead event for chat: ${chatId}`);
            setChats(prevChats =>
                prevChats.map(chat =>
                    chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
                )
            );
            setCurrentChat(prevChat =>
                prevChat && prevChat._id === chatId ? { ...prevChat, unreadCount: 0 } : prevChat
            );
        });

        // IMPORTANT: Handle 'chatHidden' from backend
        socket.current.on('chatHidden', ({ chatId, userId }) => {
            console.log(`[SOCKET] Chat ${chatId} hidden for user ${userId}.`);
            if (userId === user._id) { // Only update if it's for the current user
                setChats(prevChats => prevChats.filter(chat => chat._id !== chatId));
                if (currentChatRef.current && currentChatRef.current._id === chatId) {
                    setCurrentChat(null);
                    setCurrentChatId(null);
                    setMessages([]);
                    displayNotification('You have hidden this private chat.', 'info');
                }
            }
        });

        // IMPORTANT: Handle 'chatLeft' from backend (for groups)
        socket.current.on('chatLeft', ({ chatId, userId }) => {
            console.log(`[SOCKET] User ${userId} left chat: ${chatId}`);
            if (userId === user._id) { // If current user left the group
                setChats(prevChats => prevChats.filter(chat => chat._id !== chatId));
                if (currentChatRef.current && currentChatRef.current._id === chatId) {
                    setCurrentChat(null);
                    setCurrentChatId(null);
                    setMessages([]);
                    displayNotification('You have left the group chat.', 'info');
                }
            } else { // Another user left the group
                setChats(prevChats => prevChats.map(chat => {
                    if (chat._id === chatId) {
                        return {
                            ...chat,
                            participants: chat.participants.filter(p => p._id !== userId)
                        };
                    }
                    return chat;
                }));
                if (currentChatRef.current && currentChatRef.current._id === chatId) {
                    setCurrentChat(prevChat => ({
                        ...prevChat,
                        participants: prevChat.participants.filter(p => p._id !== userId)
                    }));
                    displayNotification(`${chats.find(c => c._id === chatId)?.participants.find(p => p._id === userId)?.username || 'A user'} has left the group.`, 'info');
                }
            }
        });


        return () => {
            if (socket.current) {
                console.log('[SOCKET] Cleaning up Socket.IO listeners and disconnecting...');
                socket.current.off('connect');
                socket.current.off('disconnect');
                socket.current.off('receive_message');
                socket.current.off('chatCreated');
                socket.current.off('chatUpdated');
                socket.current.off('group_members_updated');
                socket.current.off('chatDeleted');
                socket.current.off('chatRead');
                socket.current.off('chatHidden'); // Clean up new listener
                socket.current.off('chatLeft');   // Clean up new listener
                socket.current.disconnect();
            }
        };
    }, [user, token, displayNotification]); // Removed 'chats' from dependency array to prevent unnecessary re-runs

    // --- Load Messages for Current Chat ---
    const loadMessages = useCallback(async (chatIdToLoad) => {
        if (!chatIdToLoad || !token) {
            console.log('[LOAD MSG] No chat ID or token, clearing messages.');
            setMessages([]);
            return;
        }
        setLoadingMessages(true);
        console.log(`[LOAD MSG] Fetching messages for chat: ${chatIdToLoad}...`);
        try {
            const chatMessages = await getMessagesForChat(chatIdToLoad, token);
            setMessages(chatMessages);
            console.log(`[LOAD MSG] Messages fetched for ${chatIdToLoad}:`, chatMessages.length);

            console.log(`[LOAD MSG] Marking messages as read for chat: ${chatIdToLoad}`);
            await markMessagesAsRead(chatIdToLoad, token); // API call to mark as read

            // Update the unread count locally in state immediately
            setChats(prevChats =>
                prevChats.map(c =>
                    c._id === chatIdToLoad ? { ...c, unreadCount: 0 } : c
                )
            );
            setCurrentChat(prevChat =>
                prevChat && prevChat._id === chatIdToLoad ? { ...prevChat, unreadCount: 0 } : prevChat
            );

        } catch (error) {
            console.error('[LOAD MSG ERROR] Fetch messages error:', error);
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
        console.log('[CHAT SELECT] Selected chat:', chat._id);
        // Reset group chat creation state when selecting an existing chat
        setIsCreatingGroupChat(false);
        setSelectedUsersForGroupChat([]);
        setNewGroupChatName('');
        setSearchQuery(''); // Clear search input
        setSearchResults([]); // Clear search results

        // Leave previous chat room if one was selected
        if (socket.current && currentChatRef.current && currentChatRef.current._id && currentChatRef.current._id !== chat._id) {
            console.log(`[SOCKET] Leaving chat room: ${currentChatRef.current._id}`);
            socket.current.emit('leave_chat', currentChatRef.current._id);
        }

        // Set currentChat state
        setCurrentChat(chat);
        // Set currentChatId state to trigger message loading useEffect
        setCurrentChatId(chat._id);

        // Join the new chat's room
        if (socket.current) {
            console.log(`[SOCKET] Joining chat room: ${chat._id}`);
            socket.current.emit('join_chat', chat._id);
        }
    }, []); // Removed currentChat from deps, as it's handled by currentChatRef

    // --- Message Sending ---
    const handleSendTextMessage = useCallback(async (chatId, content) => { // Renamed handleSendMessage
        if (!socket.current || !socket.current.connected) {
            displayNotification('Not connected to chat server. Please refresh.', 'error');
            console.warn('[SEND MSG ERROR] Socket not connected when attempting to send message.');
            return;
        }
        if (!chatId || !content.trim()) {
            displayNotification('Message content cannot be empty.', 'warning');
            return;
        }

        console.log(`[SEND MSG] Emitting 'sendMessage' via socket to chat ${chatId}: "${content}"`);
        try {
            socket.current.emit('sendMessage', { chatId, content });
            console.log('[SEND MSG] Message emitted via socket. Awaiting receive_message for UI update.');
        } catch (error) {
            console.error('[SEND MSG ERROR] Socket send message error:', error);
            displayNotification('Failed to send message via socket.', 'error');
        }
    }, [displayNotification]);

    // --- User Search & Create Chat from UserSearch component ---
    const handleSearchInputChange = useCallback(async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (!isCreatingGroupChat) { // Only reset group creation state if NOT already in group creation mode
            setSelectedUsersForGroupChat([]);
            setNewGroupChatName('');
        }

        if (!query) {
            setSearchResults([]);
            return;
        }
        try {
            const data = await searchUsers(query, token);
            const filtered = data.filter(u => user && u._id !== user._id);
            setSearchResults(filtered);
        } catch (error) {
            console.error('[SEARCH] User search error:', error);
            displayNotification(error.message || 'Failed to search users.', 'error');
        }
    }, [token, user, displayNotification, isCreatingGroupChat]);

    // --- Handler for selecting/deselecting users in group chat creation mode ---
    const handleSelectUserForGroupChat = useCallback((userToToggle) => {
        setSelectedUsersForGroupChat(prevSelected => {
            const isSelected = prevSelected.some(u => u._id === userToToggle._id);
            if (isSelected) {
                return prevSelected.filter(u => u._id !== userToToggle._id);
            } else {
                return [...prevSelected, userToToggle];
            }
        });
    }, []);

    // --- Handler for initiating group chat creation mode ---
    const handleInitiateGroupChatCreation = useCallback(() => {
        setIsCreatingGroupChat(true);
        setSelectedUsersForGroupChat([]); // Clear any previous selection
        setNewGroupChatName('');
        setSearchQuery(''); // Clear search input
        setSearchResults([]); // Clear search results
        setCurrentChat(null); // Deselect current chat
        setCurrentChatId(null);
        setMessages([]);
    }, []);

    // --- Handler for cancelling group chat creation mode ---
    const handleCancelGroupChatCreation = useCallback(() => {
        setIsCreatingGroupChat(false);
        setSelectedUsersForGroupChat([]);
        setNewGroupChatName('');
        setSearchQuery('');
        setSearchResults([]);
    }, []);

    const handleCreateNewChatFromUserSearch = useCallback(async (participantIds, type, name = '', existingChatId = null) => {
        if (!user) {
            displayNotification('User not authenticated.', 'error');
            return;
        }

        if (existingChatId) {
            console.log(`[CREATE CHAT] Existing chat ID found: ${existingChatId}. Attempting to select.`);
            const foundChat = chats.find(c => c._id === existingChatId);
            if (foundChat) {
                handleChatSelect(foundChat);
                return;
            }
        }

        if (!participantIds.includes(user._id)) {
            participantIds.push(user._id);
        }

        console.log(`[CREATE CHAT] Creating new ${type} chat with participants:`, participantIds);
        try {
            const result = await createChat(participantIds, type, name, token);
            displayNotification(result.message || `${type === 'group' ? 'Group' : 'Private'} chat created successfully!`, 'success');

            // Add the new chat to the list if it's genuinely new
            setChats(prevChats => {
                const updatedChats = [result.chat, ...prevChats.filter(c => c._id !== result.chat._id)];
                const sorted = updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                return sorted;
            });
            handleChatSelect(result.chat); // Select the newly created chat

            // Reset group chat creation states after successful creation
            setIsCreatingGroupChat(false);
            setSelectedUsersForGroupChat([]);
            setNewGroupChatName('');
            setSearchQuery(''); // Clear search input
            setSearchResults([]); // Clear search results

        } catch (error) {
            console.error('[CREATE CHAT ERROR] Create chat error:', error);
            displayNotification(error.message || 'Failed to create chat.', 'error');
        }
    }, [chats, user, token, displayNotification, handleChatSelect]);


    const handleChatWindowUpdate = useCallback(async (chatId) => {
        console.log(`[CHAT WINDOW UPDATE] Received update request for chat ID: ${chatId}. Re-fetching chats.`);
        if (!token) return;
        try {
            const updatedChats = await getChats(token);
            setChats(updatedChats);
            // If the updated chat is the currently selected one, update its state as well
            const updatedCurrentChatFromList = updatedChats.find(c => c._id === chatId);
            if (updatedCurrentChatFromList) {
                setCurrentChat(updatedCurrentChatFromList);
                console.log('[CHAT WINDOW UPDATE] Updated currentChat state based on latest fetch.');
            }
        } catch (error) {
            console.error('[CHAT WINDOW UPDATE ERROR] Error re-fetching chats after update from ChatWindow:', error);
            displayNotification('Failed to refresh chat list and current chat details.', 'error');
        }
    }, [token, displayNotification]);


    // --- NEW: handleRemoveChat Function ---
    const handleRemoveChat = useCallback(async (chatId, isGroupChat) => {
        if (!token) {
            displayNotification('Authentication token is missing.', 'error');
            return;
        }

        const actionText = isGroupChat ? 'leave' : 'hide';
        console.log(`[REMOVE CHAT] Attempting to ${actionText} chat: ${chatId}`);

        try {
            let response;
            if (isGroupChat) {
                // Assuming you have a leaveGroupChat function in your api.js
                // Or you can make a direct fetch here:
                response = await fetch(`${API_BASE_URL}/chats/leave/${chatId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
            } else {
                // Assuming you have a hidePrivateChat function in your api.js
                // Or you can make a direct fetch here:
                response = await fetch(`${API_BASE_URL}/chats/hide/${chatId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${actionText} chat.`);
            }

            console.log(`[REMOVE CHAT] Successfully ${actionText}d chat: ${chatId}`);
            displayNotification(`Chat ${actionText}d successfully!`, 'success');

            // Update local state to remove the chat
            setChats(prevChats => prevChats.filter(chat => chat._id !== chatId));

            // If the removed chat was the currently selected one, clear selection
            if (currentChat && currentChat._id === chatId) {
                setCurrentChat(null);
                setCurrentChatId(null);
                setMessages([]);
                console.log('[REMOVE CHAT] Cleared selected chat and messages.');
            }

            // Emit socket event to notify server (optional, but good for consistency)
            if (socket.current) {
                if (isGroupChat) {
                    socket.current.emit('leave_chat', chatId);
                } else {
                    // For private chats, you might have a 'hide_chat' event or rely on backend to sync
                    // If the backend already handles sending 'chatHidden', this might be redundant for now.
                    // socket.current.emit('hide_chat', chatId); 
                }
            }

        } catch (error) {
            console.error(`[REMOVE CHAT ERROR] Error ${actionText}ing chat:`, error);
            displayNotification(error.message || `Failed to ${actionText} chat.`, 'error');
        }
    }, [token, currentChat, displayNotification, socket]); // Added currentChat and socket to deps


    if (!user || loadingChats) {
        return <div className="flex justify-center items-center h-screen text-lg text-gray-700">Loading chat page...</div>;
    }

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {showNotification && (
                <Notification
                    message={notificationMessage}
                    type={notificationType}
                    onClose={() => setShowNotification(false)}
                />
            )}

            <aside className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col p-4 shadow-lg overflow-y-auto">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-700">
                    <h3 className="text-white text-xl font-semibold">Welcome, {user.username}!</h3>
                    <button
                        onClick={() => {
                            console.log('[AUTH] Logging out...');
                            localStorage.removeItem('token');
                            setUser(null);
                            router.push('/');
                            router.reload();
                        }}
                        className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                        Logout
                    </button>
                </div>

                <UserSearch
                    query={searchQuery}
                    onSearchChange={handleSearchInputChange}
                    searchResults={searchResults}
                    onCreateChat={handleCreateNewChatFromUserSearch}
                    chats={chats} // Pass chats to UserSearch if it needs to check for existing DMs
                    currentUser={user}
                    showNotification={displayNotification}
                    isGroupCreationMode={isCreatingGroupChat}
                    selectedUsersForGroupChat={selectedUsersForGroupChat}
                    onSelectUserForGroupChat={handleSelectUserForGroupChat}
                    newGroupChatName={newGroupChatName}
                    onNewGroupChatNameChange={setNewGroupChatName}
                    onCreateGroupChat={handleCreateNewChatFromUserSearch}
                    onInitiateGroupChat={handleInitiateGroupChatCreation}
                    onCancelGroupChat={handleCancelGroupChatCreation}
                />

                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {chats.length === 0 && !loadingChats ? (
                        <p className="text-center text-gray-400 p-5">No chats yet. Start a new one!</p>
                    ) : (
                        <ChatList
                            chats={chats}
                            onSelectChat={handleChatSelect}
                            selectedChatId={currentChatId}
                            currentUser={user}
                            onRemoveChat={handleRemoveChat}
                        />
                    )}
                </div>
            </aside>

            <main className="flex-grow flex flex-col bg-gray-900">
                <ChatWindow
                    currentChat={currentChat}
                    messages={messages}
                    user={user}
                    onSendMessage={handleSendTextMessage} // Changed from handleSendMessage to handleSendTextMessage
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