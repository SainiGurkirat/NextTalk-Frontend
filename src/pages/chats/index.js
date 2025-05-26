// frontend/pages/chats/index.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import { getChats, getUserProfile, createChat, sendMessage, getMessagesForChat, searchUsers, markMessagesAsRead } from '../../lib/api';
import ChatWindow from '../../components/ChatWindow';
import UserSearch from '../../components/UserSearch';
import Notification from '../../components/Notification';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

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
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('info');
    const [showNotification, setShowNotification] = useState(false);

    // States specific to your UserSearch component in sidebar
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const socket = useRef(null);
    const currentChatRef = useRef(currentChat); // NEW: Ref to hold the latest currentChat

    // --- Update currentChatRef whenever currentChat state changes ---
    useEffect(() => {
        currentChatRef.current = currentChat;
        console.log('[FRONTEND DEBUG] currentChat state updated:', currentChat ? currentChat._id : 'null');
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
            console.log('[AUTH] No token found, redirecting to login.');
            router.push('/login');
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
        });

        socket.current.on('disconnect', () => {
            console.log('Socket.IO disconnected');
        });

        socket.current.on('receive_message', (newMessage) => {
            console.log('[FRONTEND] Received new message via socket:', newMessage);
            const latestCurrentChat = currentChatRef.current;
            console.log('[FRONTEND] currentChatRef.current (latest selected chat):', latestCurrentChat ? latestCurrentChat._id : 'null');
            console.log('[FRONTEND] newMessage.chat (from received message):', newMessage.chat);
            console.log('[FRONTEND] Comparison result (newMessage.chat === latestCurrentChat?._id):', latestCurrentChat && newMessage.chat === latestCurrentChat._id);

            setMessages(prevMessages => {
                console.log('[FRONTEND] Previous messages state length BEFORE update:', prevMessages.length);
                if (latestCurrentChat && newMessage.chat === latestCurrentChat._id) {
                    console.log('[FRONTEND] Condition TRUE: Adding message to current chat:', newMessage);
                    return [...prevMessages, newMessage];
                }
                console.log('[FRONTEND] Condition FALSE: Message is NOT for current chat, or no chat selected. Not updating messages state for main window.');
                return prevMessages;
            });

            // Update chats list (for sidebar preview, unread counts)
            setChats(prevChats => {
                const latestCurrentChatForUnread = currentChatRef.current; // Use ref again for unread logic
                const updatedChats = prevChats.map(chat => {
                    if (chat._id === newMessage.chat) {
                        let newUnreadCount = chat.unreadCount;
                        // Increment unread count only if message is from someone else AND chat is not currently open
                        if (newMessage.sender._id !== user._id && !(latestCurrentChatForUnread && latestCurrentChatForUnread._id === chat._id)) {
                            newUnreadCount = (newUnreadCount || 0) + 1;
                            console.log(`[FRONTEND] Incrementing unread count for chat ${chat._id}. New count: ${newUnreadCount}`);
                        } else if (newMessage.sender._id !== user._id && (latestCurrentChatForUnread && latestCurrentChatForUnread._id === chat._id)) {
                             console.log(`[FRONTEND] Message from other user in CURRENTLY OPEN chat ${chat._id}. Not incrementing unread.`);
                        } else if (newMessage.sender._id === user._id) {
                            console.log(`[FRONTEND] Message from self in chat ${chat._id}. Not incrementing unread.`);
                        }
                        
                        return {
                            ...chat,
                            lastMessage: {
                                sender: newMessage.sender,
                                content: newMessage.content,
                                timestamp: newMessage.createdAt
                            },
                            unreadCount: newUnreadCount,
                            updatedAt: newMessage.createdAt // Crucial for sorting
                        };
                    }
                    return chat;
                })
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                console.log('[FRONTEND] Chats after sidebar update (sorted by updatedAt):', updatedChats.map(c => ({_id: c._id, unread: c.unreadCount, lastMsg: c.lastMessage?.content, updatedAt: c.updatedAt})));
                return updatedChats;
            });
        });

        socket.current.on('chatCreated', (newChatData) => {
            console.log('[SOCKET] New chat created/received:', newChatData);
            setChats(prevChats => {
                // Ensure new chat is not a duplicate and add it
                if (!prevChats.some(chat => chat._id === newChatData._id)) {
                    const updated = [newChatData, ...prevChats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    console.log('[SOCKET] Chats after chatCreated (added):', updated.map(c => c._id));
                    return updated;
                }
                const sorted = prevChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                console.log('[SOCKET] Chat already exists (not added), re-sorted:', sorted.map(c => c._id));
                return sorted;
            });
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
                    } : chat
                ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                console.log('[SOCKET] Chats after chatUpdated (sidebar):', updated.map(c => c._id));
                return updated;
            });

            // If the currently selected chat is the one updated, make sure currentChat also reflects it
            setCurrentChat(prevChat => {
                if (prevChat && prevChat._id === updatedChatData._id) {
                    console.log('[SOCKET] Updating currentChat state due to chatUpdated event.');
                    return {
                        ...prevChat,
                        lastMessage: updatedChatData.lastMessage || prevChat.lastMessage,
                        updatedAt: updatedChatData.updatedAt || prevChat.updatedAt,
                        name: updatedChatData.name || prevChat.name,
                        participants: updatedChatData.participants || prevChat.participants,
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
                console.log('[SOCKET] Chats after chatDeleted:', filtered.map(c => c._id));
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


        return () => {
            if (socket.current) {
                console.log('[SOCKET] Cleaning up Socket.IO listeners...');
                socket.current.off('connect');
                socket.current.off('disconnect');
                socket.current.off('receive_message');
                socket.current.off('chatCreated');
                socket.current.off('chatUpdated');
                socket.current.off('group_members_updated');
                socket.current.off('chatDeleted');
                socket.current.off('chatRead'); // Added cleanup for chatRead
                socket.current.disconnect();
            }
        };
    // Dependencies for socket setup now excludes currentChat, as we use currentChatRef
    }, [user, token, displayNotification]);

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
            await markMessagesAsRead(chatIdToLoad, token);
            
            // Update the unread count locally for the sidebar and current chat state
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
        // Set currentChat state
        setCurrentChat(chat);
        // Set currentChatId state to trigger message loading useEffect
        setCurrentChatId(chat._id);

        // Manage socket rooms
        if (socket.current) {
            // Leave previous chat room if one was selected
            if (currentChatRef.current && currentChatRef.current._id && currentChatRef.current._id !== chat._id) {
                console.log(`[SOCKET] Leaving chat room: ${currentChatRef.current._id}`);
                socket.current.emit('leave_chat', currentChatRef.current._id);
            }
            // Join the new chat's room
            console.log(`[SOCKET] Joining chat room: ${chat._id}`);
            socket.current.emit('join_chat', chat._id);
        }
    }, []);

    // --- Message Sending ---
    const handleSendMessage = useCallback(async (chatId, content) => {
        console.log(`[SEND MSG] Attempting to send message to chat ${chatId}: "${content}"`);
        try {
            await sendMessage(chatId, content, token);
            console.log('[SEND MSG] Message sent via HTTP POST. Awaiting socket event for UI update.');
            // Message will appear via socket.io 'receive_message' event
            // No direct state update here as the socket event handles it for all clients
        } catch (error) {
            console.error('[SEND MSG ERROR] Send message error:', error);
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
            const filtered = data.filter(u => user && u._id !== user._id);
            setSearchResults(filtered);
        } catch (error) {
            console.error('[SEARCH] User search error:', error);
            displayNotification(error.message || 'Failed to search users.', 'error');
        }
    }, [token, user, displayNotification]);

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
                console.log('[CREATE CHAT] Chats after new chat creation:', sorted.map(c => c._id));
                return sorted;
            });
            handleChatSelect(result.chat); // Select the newly created chat
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

            <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col p-4 shadow-lg overflow-y-auto">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-700">
                    <h3 className="text-white text-xl font-semibold">Welcome, {user.username}!</h3>
                    <button
                        onClick={() => {
                            console.log('[AUTH] Logging out...');
                            localStorage.removeItem('token');
                            router.push('/login');
                        }}
                        className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                        Logout
                    </button>
                </div>

                <div className="mb-4">
                    <UserSearch
                        query={searchQuery}
                        onSearchChange={handleSearchInputChange}
                        searchResults={searchResults}
                        onCreateChat={handleCreateNewChatFromUserSearch}
                        chats={chats}
                        currentUser={user}
                        showNotification={displayNotification}
                    />
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {chats.length === 0 && !loadingChats ? (
                        <p className="text-center text-gray-400 p-5">No chats yet. Start a new one!</p>
                    ) : (
                        chats.map(chat => {
                            let chatDisplayName = chat.name;
                            let chatDisplayImage = '/default-group-avatar.png';

                            // Determine chat name and image for private chats
                            if (chat.type === 'private') {
                                // Find the other participant in a private chat
                                const otherParticipant = chat.participants.find(p => p._id !== user._id);
                                if (otherParticipant) {
                                    chatDisplayName = otherParticipant.username;
                                    chatDisplayImage = otherParticipant.profilePicture || '/default-avatar.png';
                                } else if (chat.participants.length === 1 && chat.participants[0]._id === user._id) {
                                    // Case for a "self-chat" (chat with only the current user)
                                    chatDisplayName = `${user.username} (You)`;
                                    chatDisplayImage = user.profilePicture || '/default-avatar.png';
                                } else {
                                    chatDisplayName = 'Unknown User'; // Fallback
                                    chatDisplayImage = '/default-avatar.png';
                                }
                            }

                            return (
                                <div
                                    key={chat._id}
                                    onClick={() => handleChatSelect(chat)}
                                    className={`flex items-center p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors relative
                                    ${currentChatId === chat._id ? 'bg-gray-700 border-l-4 border-blue-500' : ''}`}
                                >
                                    <img src={chatDisplayImage} alt={chatDisplayName} className="w-12 h-12 rounded-full mr-4 object-cover border border-gray-600" />
                                    <div className="flex-grow flex flex-col min-w-0">
                                        <span className="font-semibold text-white truncate">{chatDisplayName}</span>
                                        {chat.lastMessage && (
                                            <span className="text-sm text-gray-400 truncate">
                                                {chat.lastMessage.sender?._id === user._id ? 'You: ' : `${chat.lastMessage.sender?.username}: `}
                                                {chat.lastMessage.content}
                                            </span>
                                        )}
                                    </div>
                                    {chat.unreadCount > 0 && (
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