// frontend/pages/chats/index.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import { getChats, getUserProfile, createChat, getMessagesForChat, searchUsers, markMessagesAsRead } from '../../lib/api';
import ChatWindow from '../../components/ChatWindow';
import UserSearch from '../../components/UserSearch';
import Notification from '../../components/Notification';
import ChatList from '../../components/ChatList';

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
    const [showUserMenu, setShowUserMenu] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const [isCreatingGroupChat, setIsCreatingGroupChat] = useState(false);
    const [selectedUsersForGroupChat, setSelectedUsersForGroupChat] = useState([]);
    const [newGroupChatName, setNewGroupChatName] = useState('');

    const socket = useRef(null);
    // currentChat for socket listeners, avoids stale closures
    const currentChatRef = useRef(currentChat);
    // for closing user menu if clicked outside
    const userMenuRef = useRef(null);

    // keep currentChatRef updated
    useEffect(() => {
        currentChatRef.current = currentChat;
    }, [currentChat]);

    // close user menu when clicking away
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // show a notification
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

    // auth check and initial data fetch
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
            router.push('/');
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

                if (router.query.chatId) {
                    const chatFromUrl = initialChats.find(c => c._id === router.query.chatId);
                    if (chatFromUrl) {
                        handleChatSelect(chatFromUrl);
                    }
                }
            } catch (error) {
                displayNotification(error.message || 'Failed to load data. Please log in again.', 'error');
                localStorage.removeItem('token');
                router.push('/login');
            }
        };
        fetchUserProfileAndChats();
    }, [router, displayNotification]);

    // setup socket.io connection and listeners
    useEffect(() => {
        if (!user || !token) {
            return;
        }

        socket.current = io(SOCKET_URL, {
            query: { token },
            transports: ['websocket', 'polling'],
        });

        socket.current.on('connect', () => {
            socket.current.emit('register_user', user._id);
            if (chats.length > 0) {
                chats.forEach(chat => {
                    socket.current.emit('join_chat', chat._id);
                });
            }
        });

        socket.current.on('disconnect', () => {
            console.log('Socket.IO disconnected');
        });

        socket.current.on('receive_message', (newMessage) => {
            const latestCurrentChat = currentChatRef.current;

            if (newMessage.sender && typeof newMessage.sender === 'string') {
                if (newMessage.sender === user._id) {
                    newMessage.sender = user;
                } else if (latestCurrentChat) {
                    const participant = latestCurrentChat.participants.find(p => p._id === newMessage.sender);
                    if (participant) {
                        newMessage.sender = participant;
                    }
                }
            } else if (!newMessage.sender && newMessage.senderId === user._id) {
                newMessage.sender = user;
            }

            setMessages(prevMessages => {
                if (latestCurrentChat && newMessage.chat === latestCurrentChat._id) {
                    if (!prevMessages.some(msg => msg._id === newMessage._id)) {
                        return [...prevMessages, newMessage];
                    }
                }
                return prevMessages;
            });

            setChats(prevChats => {
                const updatedChats = prevChats.map(chat => {
                    if (chat._id === newMessage.chat) {
                        let newUnreadCount = chat.unreadCount;
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
            setChats(prevChats => {
                if (!prevChats.some(chat => chat._id === newChatData._id)) {
                    const updated = [newChatData, ...prevChats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    return updated;
                }
                const sorted = prevChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                return sorted;
            });
            if (newChatData.participants.some(p => p._id === user._id || p === user._id)) {
                socket.current.emit('join_chat', newChatData._id);
            }
            displayNotification(`New chat: ${newChatData.name || 'Private Chat'}`, 'info');
        });

        socket.current.on('chatUpdated', (updatedChatData) => {
            setChats(prevChats => {
                const updated = prevChats.map(chat =>
                    chat._id === updatedChatData._id ? {
                        ...chat,
                        lastMessage: updatedChatData.lastMessage || chat.lastMessage,
                        updatedAt: updatedChatData.updatedAt || chat.updatedAt,
                        name: updatedChatData.name || chat.name,
                        participants: updatedChatData.participants || chat.participants,
                        unreadCount: updatedChatData.unreadCount !== undefined ? updatedChatData.unreadCount : chat.unreadCount,
                    } : chat
                ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                return updated;
            });

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
            setChats(prevChats =>
                prevChats.map(chat =>
                    chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
                )
            );
            setCurrentChat(prevChat =>
                prevChat && prevChat._id === chatId ? { ...prevChat, unreadCount: 0 } : prevChat
            );
        });

        socket.current.on('chatHidden', ({ chatId, userId }) => {
            if (userId === user._id) {
                setChats(prevChats => prevChats.filter(chat => chat._id !== chatId));
                if (currentChatRef.current && currentChatRef.current._id === chatId) {
                    setCurrentChat(null);
                    setCurrentChatId(null);
                    setMessages([]);
                    displayNotification('You have hidden this private chat.', 'info');
                }
            }
        });

        socket.current.on('chatLeft', ({ chatId, userId }) => {
            if (userId === user._id) {
                setChats(prevChats => prevChats.filter(chat => chat._id !== chatId));
                if (currentChatRef.current && currentChatRef.current._id === chatId) {
                    setCurrentChat(null);
                    setCurrentChatId(null);
                    setMessages([]);
                    displayNotification('You have left the group chat.', 'info');
                }
            } else {
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

        // cleanup function for socket listeners
        return () => {
            if (socket.current) {
                socket.current.off('connect');
                socket.current.off('disconnect');
                socket.current.off('receive_message');
                socket.current.off('chatCreated');
                socket.current.off('chatUpdated');
                socket.current.off('group_members_updated');
                socket.current.off('chatDeleted');
                socket.current.off('chatRead');
                socket.current.off('chatHidden');
                socket.current.off('chatLeft');
                socket.current.disconnect();
            }
        };
    }, [user, token, displayNotification]);

    // fetch messages for a specific chat
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
            displayNotification(error.message || 'Failed to load messages.', 'error');
        } finally {
            setLoadingMessages(false);
        }
    }, [token, displayNotification]);

    // reload messages when currentChatId changes
    useEffect(() => {
        if (currentChatId) {
            loadMessages(currentChatId);
        }
    }, [currentChatId, loadMessages]);

    // what happens when you pick a chat
    const handleChatSelect = useCallback((chat) => {
        setIsCreatingGroupChat(false);
        setSelectedUsersForGroupChat([]);
        setNewGroupChatName('');
        setSearchQuery('');
        setSearchResults([]);

        if (socket.current && currentChatRef.current && currentChatRef.current._id && currentChatRef.current._id !== chat._id) {
            socket.current.emit('leave_chat', currentChatRef.current._id);
        }

        setCurrentChat(chat);
        setCurrentChatId(chat._id);

        if (socket.current) {
            socket.current.emit('join_chat', chat._id);
        }
    }, []);

    // send a text message
    const handleSendTextMessage = useCallback(async (chatId, content) => {
        if (!socket.current || !socket.current.connected) {
            displayNotification('Not connected to chat server. Please refresh.', 'error');
            return;
        }
        if (!chatId || !content.trim()) {
            displayNotification('Message content cannot be empty.', 'warning');
            return;
        }

        try {
            socket.current.emit('sendMessage', { chatId, content });
        } catch (error) {
            displayNotification('Failed to send message via socket.', 'error');
        }
    }, [displayNotification]);

    // handle user search input
    const handleSearchInputChange = useCallback(async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (!isCreatingGroupChat) {
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
            displayNotification(error.message || 'Failed to search users.', 'error');
        }
    }, [token, user, displayNotification, isCreatingGroupChat]);

    // add or remove user from group chat selection
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

    // start the group chat creation process
    const handleInitiateGroupChatCreation = useCallback(() => {
        setIsCreatingGroupChat(true);
        setSelectedUsersForGroupChat([]);
        setNewGroupChatName('');
        setSearchQuery('');
        setSearchResults([]);
        setCurrentChat(null);
        setCurrentChatId(null);
        setMessages([]);
    }, []);

    // cancel group chat creation
    const handleCancelGroupChatCreation = useCallback(() => {
        setIsCreatingGroupChat(false);
        setSelectedUsersForGroupChat([]);
        setNewGroupChatName('');
        setSearchQuery('');
        setSearchResults([]);
    }, []);

    // create new private or group chat
    const handleCreateNewChatFromUserSearch = useCallback(async (participantIds, type, name = '', existingChatId = null) => {
        if (!user) {
            displayNotification('User not authenticated.', 'error');
            return;
        }

        if (existingChatId) {
            const foundChat = chats.find(c => c._id === existingChatId);
            if (foundChat) {
                handleChatSelect(foundChat);
                return;
            }
        }

        if (!participantIds.includes(user._id)) {
            participantIds.push(user._id);
        }

        try {
            const result = await createChat(participantIds, type, name, token);
            displayNotification(result.message || `${type === 'group' ? 'Group' : 'Private'} chat created successfully!`, 'success');

            setChats(prevChats => {
                const updatedChats = [result.chat, ...prevChats.filter(c => c._id !== result.chat._id)];
                const sorted = updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                return sorted;
            });
            handleChatSelect(result.chat);

            setIsCreatingGroupChat(false);
            setSelectedUsersForGroupChat([]);
            setNewGroupChatName('');
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            displayNotification(error.message || 'Failed to create chat.', 'error');
        }
    }, [chats, user, token, displayNotification, handleChatSelect]);

    // update chat details when changes happen in ChatWindow
    const handleChatWindowUpdate = useCallback(async (chatId) => {
        if (!token) return;
        try {
            const updatedChats = await getChats(token);
            setChats(updatedChats);
            const updatedCurrentChatFromList = updatedChats.find(c => c._id === chatId);
            if (updatedCurrentChatFromList) {
                setCurrentChat(updatedCurrentChatFromList);
            }
        } catch (error) {
            displayNotification('Failed to refresh chat list and current chat details.', 'error');
        }
    }, [token, displayNotification]);

    // remove a chat (leave group or hide private)
    const handleRemoveChat = useCallback(async (chatId, isGroupChat) => {
        if (!token) {
            displayNotification('Authentication token is missing.', 'error');
            return;
        }

        const actionText = isGroupChat ? 'leave' : 'hide';

        try {
            let response;
            if (isGroupChat) {
                response = await fetch(`${API_BASE_URL}/chats/leave/${chatId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
            } else {
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

            displayNotification(`Chat ${actionText}d successfully!`, 'success');

            setChats(prevChats => prevChats.filter(chat => chat._id !== chatId));

            if (currentChat && currentChat._id === chatId) {
                setCurrentChat(null);
                setCurrentChatId(null);
                setMessages([]);
            }

            if (socket.current) {
                if (isGroupChat) {
                    socket.current.emit('leave_chat', chatId);
                }
            }

        } catch (error) {
            displayNotification(error.message || `Failed to ${actionText} chat.`, 'error');
        }
    }, [token, currentChat, displayNotification, socket]);

    // log user out
    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/');
        router.reload();
    }, [router]);

    // navigate to settings page
    const handleSettingsClick = useCallback(() => {
        router.push('/settings');
        setShowUserMenu(false);
    }, [router]);

    // loading state
    if (!user || loadingChats) {
        return <div className="flex justify-center items-center h-screen text-lg text-gray-700">Loading chat page...</div>;
    }

    // main chat page layout
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
                <div className="relative flex justify-between items-center mb-5 pb-3 border-b border-gray-700 h-16">
                    <h3 className="text-white text-xl font-semibold">Chats</h3>
                    <div ref={userMenuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="focus:outline-none flex items-center justify-center w-10 h-10 rounded-full overflow-hidden"
                            aria-label="Open user menu"
                        >
                            <img
                                src={user.profilePicture || `https://placehold.co/40x40/374151/E5E7EB?text=${user.username[0].toUpperCase()}`}
                                alt={user.username}
                                className="w-full h-full object-cover"
                            />
                        </button>
                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-10">
                                <button
                                    onClick={handleSettingsClick}
                                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600"
                                >
                                    Settings
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600"
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <UserSearch
                    query={searchQuery}
                    onSearchChange={handleSearchInputChange}
                    searchResults={searchResults}
                    onCreateChat={handleCreateNewChatFromUserSearch}
                    chats={chats}
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
                    onSendMessage={handleSendTextMessage}
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