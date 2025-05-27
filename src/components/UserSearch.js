// frontend/components/UserSearch.js
import React, { useState, useCallback } from 'react';

const UserSearch = ({
    query,
    onSearchChange,
    searchResults,
    onCreateChat, // For private chat creation (from ChatsPage)
    chats, // For main sidebar (check existing private chats)
    currentUser, // For main sidebar
    showNotification, // For displaying notifications
    // --- PROPS FOR GROUP CHAT CREATION MODE ---
    isGroupCreationMode, // Boolean: true if we are in group creation mode (either new creation or adding to existing)
    selectedUsersForGroupChat, // Array of users currently selected for the new group (from ChatsPage or ChatWindow)
    onSelectUserForGroupChat, // Function to toggle user selection for group (from ChatsPage or ChatWindow)
    newGroupChatName, // Current value of the group chat name input (from ChatsPage)
    onNewGroupChatNameChange, // Function to update the group chat name (from ChatsPage)
    onCreateGroupChat, // Function to actually create the group chat (from ChatsPage)
    onInitiateGroupChat, // Handler to start group creation mode (from ChatsPage)
    onCancelGroupChat, // Handler to cancel group creation mode (from ChatsPage)
    // --- NEW PROPS FOR ADDING MEMBERS TO EXISTING GROUP ---
    isAddingMembersToExistingGroup, // Boolean: true if UserSearch is used specifically for adding members to an existing group
    onAddMembersToExistingGroup // Function to call when confirming adding members to an existing group
}) => {
    // Determines which array of selected users to use for highlighting
    const usersToHighlight = isGroupCreationMode ? selectedUsersForGroupChat : [];

    // Function to check if a user is currently selected (for styling)
    const isUserCurrentlySelected = useCallback((user) => {
        return usersToHighlight.some(u => u._id === user._id);
    }, [usersToHighlight]);

    const handleCreatePrivateChatClick = useCallback(async (selectedUser) => {
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
            onCreateChat([], 'private', '', existingPrivateChat._id); // Pass existingChatId to parent
            return;
        }

        // For private chat: only two participants (currentUser and selectedUser)
        await onCreateChat([selectedUser._id], 'private'); // onCreateChat will add current user's ID
    }, [currentUser, onCreateChat, chats, showNotification]);


    const handleCreateGroupChatInternal = useCallback(async () => {
        if (selectedUsersForGroupChat.length === 0 || !newGroupChatName.trim()) {
            showNotification('Please select users and provide a group name.', 'warning');
            return;
        }
        if (!onCreateGroupChat) return;

        const participantIds = selectedUsersForGroupChat.map(u => u._id);
        await onCreateGroupChat(participantIds, 'group', newGroupChatName.trim());

        // Parent (ChatsPage) will handle resetting state after creation
    }, [selectedUsersForGroupChat, newGroupChatName, onCreateGroupChat, showNotification]);


    return (
        <div className="bg-gray-700 p-4 rounded-lg shadow-md">
            {/* Flex container for search input and button */}
            <div className="flex items-center space-x-2 mb-4">
                <input
                    type="text"
                    placeholder={isGroupCreationMode ? "Search users to add..." : "Search users..."}
                    // Adjusted padding to match button height more closely
                    className="flex-grow py-2 px-3 rounded-md bg-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={query}
                    onChange={onSearchChange}
                />
                {/* The plus/cancel button is only shown if not in the "adding to existing group" mode,
                    as that mode is triggered by a different button in ChatWindow */}
                {!isAddingMembersToExistingGroup && !isGroupCreationMode ? (
                    <button
                        onClick={onInitiateGroupChat}
                        title="Create Group Chat"
                        // Adjusted size, background, and text color for Discord-like look
                        className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-xl font-bold hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        +
                    </button>
                ) : !isAddingMembersToExistingGroup && isGroupCreationMode ? ( // Show cancel button only for new group creation flow
                    <button
                        onClick={onCancelGroupChat}
                        title="Cancel Group Creation"
                        // Adjusted size, background, and text color for Discord-like look
                        className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-xl font-bold hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        &times; {/* Times symbol for cancel */}
                    </button>
                ) : null /* Do not show the plus/cancel button when adding members to an existing group */}
            </div>

            {searchResults.length > 0 && (
                <div className="mt-3 bg-gray-600 rounded-md max-h-48 overflow-y-auto custom-scrollbar">
                    <ul>
                        {searchResults.map(user => (
                            <div
                                key={user._id}
                                // Conditionally call the appropriate handler based on mode
                                // In group creation/add members mode: toggle selection
                                // Not in group creation mode: initiate private chat
                                onClick={() => isGroupCreationMode ? onSelectUserForGroupChat(user) : handleCreatePrivateChatClick(user)}
                                // Adjusted hover and selected background colors for Discord-like look
                                className={`flex items-center justify-between py-2.5 px-3 cursor-pointer hover:bg-gray-500 rounded-md mx-1 my-0.5
                                    ${isUserCurrentlySelected(user) ? 'bg-blue-700 hover:bg-blue-700' : ''}`}
                            >
                                <div className="flex items-center">
                                    {/* Adjusted placeholder avatar background color */}
                                    <img src={user.profilePicture || `https://placehold.co/32x32/374151/E5E7EB?text=${user.username[0].toUpperCase()}`} alt={user.username} className="w-8 h-8 rounded-full mr-3 object-cover" />
                                    <span className="text-white">{user.username}</span>
                                </div>
                                {/* Show 'Chat' button only if NOT in group creation mode (i.e., for private chats) */}
                                {!isGroupCreationMode && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCreatePrivateChatClick(user); }}
                                        className="bg-blue-600 text-white text-sm px-3 py-1 rounded-md hover:bg-blue-700"
                                    >
                                        Chat
                                    </button>
                                )}
                            </div>
                        ))}
                    </ul>
                </div>
            )}

            {/* Group Chat Creation / Add Members UI (only if in group creation mode) */}
            {isGroupCreationMode && (
                <div className="mt-4 border-t border-gray-500 pt-4">
                    <h4 className="text-white text-lg font-semibold mb-2">
                        {isAddingMembersToExistingGroup ? "Users to Add" : `Selected for Group Chat (${selectedUsersForGroupChat.length})`}
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {selectedUsersForGroupChat.length === 0 ? (
                            <p className="text-gray-400 text-sm">No users selected yet. Click on users in search results to add them.</p>
                        ) : (
                            selectedUsersForGroupChat.map(user => (
                                <span key={user._id}
                                    // Adjusted pill background color for Discord-like look
                                    className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm flex items-center">
                                    {user.username}
                                    <button onClick={() => onSelectUserForGroupChat(user)}
                                        // Adjusted 'x' button size and color within pill
                                        className="ml-2 text-gray-300 text-base hover:text-white leading-none">&times;</button>
                                </span>
                            ))
                        )}
                    </div>
                    {/* Conditional rendering for Group Name input and action button */}
                    {selectedUsersForGroupChat.length > 0 && (
                        <>
                            {!isAddingMembersToExistingGroup && ( // Only show Group Name for new group creation
                                <input
                                    type="text"
                                    placeholder="Group Name"
                                    className="w-full p-2 rounded-md bg-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                                    value={newGroupChatName}
                                    onChange={(e) => onNewGroupChatNameChange(e.target.value)}
                                />
                            )}
                            <button
                                onClick={isAddingMembersToExistingGroup ? onAddMembersToExistingGroup : handleCreateGroupChatInternal}
                                className={`w-full py-2 rounded-md font-semibold transition-colors
                                    ${isAddingMembersToExistingGroup ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                            >
                                {isAddingMembersToExistingGroup ? "Add Selected Members" : "Start Group Chat"}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserSearch;