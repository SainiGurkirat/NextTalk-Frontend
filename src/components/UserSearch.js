// frontend/components/UserSearch.js
import React, { useState, useCallback } from 'react';

const UserSearch = ({
    query,
    onSearchChange,
    searchResults,
    onCreateChat, // for private chat creation (from chatspage)
    chats, // for checking existing private chats
    currentUser, // for the current logged-in user
    showNotification, // for displaying notifications
    
    // props for group chat creation mode
    isGroupCreationMode, // true if in group creation mode
    selectedUsersForGroupChat, // users selected for the new group
    onSelectUserForGroupChat, // function to toggle user selection
    newGroupChatName, // input value for new group chat name
    onNewGroupChatNameChange, // function to update group chat name
    onCreateGroupChat, // function to create the group chat
    onInitiateGroupChat, // handler to start group creation mode
    onCancelGroupChat, // handler to cancel group creation mode

    // props for adding members to existing group
    isAddingMembersToExistingGroup, // true if adding members to an existing group
    onAddMembersToExistingGroup // function to confirm adding members
}) => {
    // determine which array of selected users to highlight
    const usersToHighlight = isGroupCreationMode ? selectedUsersForGroupChat : [];

    // check if a user is currently selected for highlighting
    const isUserCurrentlySelected = useCallback((user) => {
        return usersToHighlight.some(u => u._id === user._id);
    }, [usersToHighlight]);

    // handle creating a private chat with a selected user
    const handleCreatePrivateChatClick = useCallback(async (selectedUser) => {
        if (!currentUser || !onCreateChat) return;

        // check if private chat already exists
        const existingPrivateChat = chats.find(chat =>
            chat.type === 'private' &&
            chat.participants.length === 2 && // ensure it's a 1-on-1 chat
            chat.participants.some(p => p._id === selectedUser._id) &&
            chat.participants.some(p => p._id === currentUser._id)
        );

        if (existingPrivateChat) {
            showNotification(`chat with ${selectedUser.username} already exists.`, 'info');
            // if chat exists, select it instead of creating a new one
            onCreateChat([], 'private', '', existingPrivateChat._id); // pass existingchatid to parent
            return;
        }

        // create new private chat
        await onCreateChat([selectedUser._id], 'private'); // oncreatechat will add current user's id
    }, [currentUser, onCreateChat, chats, showNotification]);

    // handle internal logic for creating a group chat
    const handleCreateGroupChatInternal = useCallback(async () => {
        if (selectedUsersForGroupChat.length === 0 || !newGroupChatName.trim()) {
            showNotification('please select users and provide a group name.', 'warning');
            return;
        }
        if (!onCreateGroupChat) return;

        const participantIds = selectedUsersForGroupChat.map(u => u._id);
        await onCreateGroupChat(participantIds, 'group', newGroupChatName.trim());

        // parent (chatspage) will handle resetting state after creation
    }, [selectedUsersForGroupChat, newGroupChatName, onCreateGroupChat, showNotification]);

    return (
        <div className="bg-gray-700 p-4 rounded-lg shadow-md">
            {/* flex container for search input and button */}
            <div className="flex items-center space-x-2 mb-4">
                <input
                    type="text"
                    placeholder={isGroupCreationMode ? "search users to add..." : "search users..."}
                    className="flex-grow py-2 px-3 rounded-md bg-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={query}
                    onChange={onSearchChange}
                />
                {/* plus/cancel button: shown based on mode */}
                {!isAddingMembersToExistingGroup && !isGroupCreationMode ? (
                    <button
                        onClick={onInitiateGroupChat}
                        title="create group chat"
                        className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-xl font-bold hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        +
                    </button>
                ) : !isAddingMembersToExistingGroup && isGroupCreationMode ? ( // show cancel button only for new group creation flow
                    <button
                        onClick={onCancelGroupChat}
                        title="cancel group creation"
                        className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-xl font-bold hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        &times; {/* times symbol for cancel */}
                    </button>
                ) : null /* do not show the plus/cancel button when adding members to an existing group */}
            </div>

            {searchResults.length > 0 && (
                <div className="mt-3 bg-gray-600 rounded-md max-h-48 overflow-y-auto custom-scrollbar">
                    <ul>
                        {searchResults.map(user => (
                            <div
                                key={user._id}
                                // conditionally call the appropriate handler based on mode
                                onClick={() => isGroupCreationMode ? onSelectUserForGroupChat(user) : handleCreatePrivateChatClick(user)}
                                className={`flex items-center justify-between py-2.5 px-3 cursor-pointer hover:bg-gray-500 rounded-md mx-1 my-0.5
                                    ${isUserCurrentlySelected(user) ? 'bg-blue-700 hover:bg-blue-700' : ''}`}
                            >
                                <div className="flex items-center">
                                    <img src={user.profilePicture || `https://placehold.co/32x32/374151/E5E7EB?text=${user.username[0].toUpperCase()}`} alt={user.username} className="w-8 h-8 rounded-full mr-3 object-cover" />
                                    <span className="text-white">{user.username}</span>
                                </div>
                                {/* show 'chat' button only if not in group creation mode (i.e., for private chats) */}
                                {!isGroupCreationMode && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCreatePrivateChatClick(user); }}
                                        className="bg-blue-600 text-white text-sm px-3 py-1 rounded-md hover:bg-blue-700"
                                    >
                                        chat
                                    </button>
                                )}
                            </div>
                        ))}
                    </ul>
                </div>
            )}

            {/* group chat creation / add members ui (only if in group creation mode) */}
            {isGroupCreationMode && (
                <div className="mt-4 border-t border-gray-500 pt-4">
                    <h4 className="text-white text-lg font-semibold mb-2">
                        {isAddingMembersToExistingGroup ? "users to add" : `selected for group chat (${selectedUsersForGroupChat.length})`}
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {selectedUsersForGroupChat.length === 0 ? (
                            <p className="text-gray-400 text-sm">no users selected yet. click on users in search results to add them.</p>
                        ) : (
                            selectedUsersForGroupChat.map(user => (
                                <span key={user._id}
                                    className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm flex items-center">
                                    {user.username}
                                    <button onClick={() => onSelectUserForGroupChat(user)}
                                        className="ml-2 text-gray-300 text-base hover:text-white leading-none">&times;</button>
                                </span>
                            ))
                        )}
                    </div>
                    {/* conditional rendering for group name input and action button */}
                    {selectedUsersForGroupChat.length > 0 && (
                        <>
                            {!isAddingMembersToExistingGroup && ( // only show group name for new group creation
                                <input
                                    type="text"
                                    placeholder="group name"
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
                                {isAddingMembersToExistingGroup ? "add selected members" : "start group chat"}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserSearch;