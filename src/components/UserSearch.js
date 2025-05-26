// frontend/components/UserSearch.js
import React, { useState, useCallback } from 'react';

const UserSearch = ({
    query,
    onSearchChange,
    searchResults,
    onCreateChat, // For main sidebar (create new chat)
    chats, // For main sidebar (check existing private chats)
    currentUser, // For main sidebar
    showNotification, // For displaying notifications
    onSelectUser, // For member selection in add members modal (new)
    selectedUsers = [] // For member selection in add members modal (new)
}) => {
    // State for creating new group/private chats (used when onCreateChat is provided)
    const [selectedUsersForNewChat, setSelectedUsersForNewChat] = useState([]);
    const [newGroupChatName, setNewGroupChatName] = useState('');
    // const [showGroupChatCreation, setShowGroupChatCreation] = useState(false); // Can derive from selectedUsersForNewChat.length


    const handleUserSelectForNewChat = useCallback((user) => {
        setSelectedUsersForNewChat(prev =>
            prev.some(u => u._id === user._id)
                ? prev.filter(u => u._id !== user._id)
                : [...prev, user]
        );
    }, []);

    const handleCreateChatClick = useCallback(async (selectedUser) => {
        if (!currentUser || !onCreateChat) return;

        // Check if private chat already exists
        const existingPrivateChat = chats.find(chat =>
            chat.type === 'private' &&
            chat.participants.length === 2 && // Ensure it's a 1-on-1 chat
            chat.participants.some(p => p._id === selectedUser._id) &&
            chat.participants.some(p => p._id === currentUser._id)
        );

        if (existingPrivateChat) {
            showNotification(`Chat with ${selectedUser.username} already exists.`, 'info');
            // If chat exists, just select it instead of creating a new one
            onCreateChat([], 'private', '', existingPrivateChat._id);
            setSelectedUsersForNewChat([]); // Clear selected after action
            setNewGroupChatName('');
            return;
        }

        // For private chat: only two participants (currentUser and selectedUser)
        await onCreateChat([selectedUser._id], 'private'); // onCreateChat will add current user's ID
        setSelectedUsersForNewChat([]);
        setNewGroupChatName('');
    }, [currentUser, onCreateChat, chats, showNotification]);


    const handleCreateGroupChat = useCallback(async () => {
        if (selectedUsersForNewChat.length === 0 || !newGroupChatName.trim()) {
            showNotification('Please select users and provide a group name.', 'warning');
            return;
        }
        if (!onCreateChat) return;

        const participantIds = selectedUsersForNewChat.map(u => u._id);
        await onCreateChat(participantIds, 'group', newGroupChatName.trim());

        // Reset state after creation
        setSelectedUsersForNewChat([]);
        setNewGroupChatName('');
    }, [selectedUsersForNewChat, newGroupChatName, onCreateChat, showNotification]);


    // Function to check if a user is currently selected (for styling)
    const isUserCurrentlySelected = useCallback((user) => {
        if (onSelectUser) { // If onSelectUser prop is present, it's for the modal's multi-select
            return selectedUsers.some(u => u._id === user._id);
        }
        // Otherwise, it's for new chat creation in sidebar's single/multi-select
        return selectedUsersForNewChat.some(u => u._id === user._id);
    }, [selectedUsersForNewChat, onSelectUser, selectedUsers]);


    return (
        <div className="bg-gray-700 p-4 rounded-lg shadow-md">
            <input
                type="text"
                placeholder="Search users..."
                className="w-full p-2 rounded-md bg-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={query}
                onChange={onSearchChange}
            />
            {searchResults.length > 0 && (
                <div className="mt-3 bg-gray-600 rounded-md max-h-48 overflow-y-auto custom-scrollbar">
                    {searchResults.map(user => (
                        <div
                            key={user._id}
                            // Use onSelectUser if provided, otherwise the default handler for new chat creation
                            onClick={() => onSelectUser ? onSelectUser(user) : handleUserSelectForNewChat(user)}
                            className={`flex items-center justify-between p-2 cursor-pointer hover:bg-gray-500 ${isUserCurrentlySelected(user) ? 'bg-blue-500' : ''}`}
                        >
                            <div className="flex items-center">
                                <img src={user.profilePicture || '/default-avatar.png'} alt={user.username} className="w-8 h-8 rounded-full mr-3 object-cover" />
                                <span className="text-white">{user.username}</span>
                            </div>
                            {/* Show 'Chat' button only if onCreateChat is available and it's NOT in multi-select mode (onSelectUser is not present) */}
                            {onCreateChat && !onSelectUser && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleCreateChatClick(user); }}
                                    className="bg-blue-500 text-white text-sm px-3 py-1 rounded-md hover:bg-blue-600"
                                >
                                    Chat
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Group Chat Creation UI (only for main sidebar usage, not for modal) */}
            {onCreateChat && !onSelectUser && selectedUsersForNewChat.length > 0 && (
                <div className="mt-4 border-t border-gray-500 pt-4">
                    <h4 className="text-white text-lg font-semibold mb-2">Create Group Chat</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {selectedUsersForNewChat.map(user => (
                            <span key={user._id} className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                                {user.username}
                                <button onClick={() => handleUserSelectForNewChat(user)} className="ml-2 text-white hover:text-gray-300">&times;</button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Group Name"
                        className="w-full p-2 rounded-md bg-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                        value={newGroupChatName}
                        onChange={(e) => setNewGroupChatName(e.target.value)}
                    />
                    <button
                        onClick={handleCreateGroupChat}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md font-semibold"
                    >
                        Start Group Chat
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserSearch;