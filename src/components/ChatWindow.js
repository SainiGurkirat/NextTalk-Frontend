// frontend/components/ChatWindow.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatMessage from './ChatMessage'; // Assuming ChatMessage component exists
import ChatInput from './ChatInput'; // Re-import ChatInput
import { getGroupMembers, addGroupMembers, removeGroupMember, searchUsers } from '../lib/api';
import Notification from './Notification'; // Assuming you have this
import UserSearch from './UserSearch'; // Reuse UserSearch for adding members

const ChatWindow = ({ currentChat, messages, user, onSendMessage, loadingMessages, showNotification, token, onChatUpdate }) => {
    const messagesEndRef = useRef(null);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [groupMembers, setGroupMembers] = useState([]);
    const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

    // State for adding members via search within the modal
    const [addMemberSearchQuery, setAddMemberSearchQuery] = useState('');
    const [addMemberSearchResults, setAddMemberSearchResults] = useState([]);
    const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);

    // State for custom confirmation dialog for removing members
    const [showConfirmRemoveModal, setShowConfirmRemoveModal] = useState(false);
    const [memberToRemoveId, setMemberToRemoveId] = useState(null);
    const [memberToRemoveUsername, setMemberToRemoveUsername] = useState('');


    // Scroll to latest message whenever messages or the currentChat changes
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
        }
    }, [messages, currentChat]);

    // Check if current user is admin whenever currentChat or user changes
    useEffect(() => {
        if (currentChat && user && currentChat.type === 'group') {
            setIsCurrentUserAdmin(currentChat.admins?.includes(user._id));
        } else {
            setIsCurrentUserAdmin(false);
        }
    }, [currentChat, user]);


    // Function to fetch and update group members
    const fetchGroupMembers = useCallback(async () => {
        if (currentChat && currentChat.type === 'group' && token) {
            try {
                const members = await getGroupMembers(currentChat._id, token);
                setGroupMembers(members);
            } catch (error) {
                console.error('Failed to fetch group members:', error);
                showNotification(error.message || 'Failed to load group members.', 'error');
            }
        }
    }, [currentChat, token, showNotification]);

    // Fetch members when modal opens or current chat changes
    useEffect(() => {
        if (showMembersModal && currentChat && currentChat.type === 'group') {
            fetchGroupMembers();
        }
    }, [showMembersModal, currentChat, fetchGroupMembers]);


    // Handle adding members search
    const handleAddMemberSearch = useCallback(async (e) => {
        const query = e.target.value;
        setAddMemberSearchQuery(query);
        if (!query) {
            setAddMemberSearchResults([]);
            return;
        }
        try {
            const data = await searchUsers(query, token);
            const currentMemberIds = new Set(groupMembers.map(m => m._id));
            const filtered = data.filter(u => u._id !== user._id && !currentMemberIds.has(u._id));
            setAddMemberSearchResults(filtered);
        } catch (error) {
            console.error('Add member search error:', error);
            showNotification(error.message || 'Failed to search users to add.', 'error');
        }
    }, [token, user, groupMembers, showNotification]);

    const handleSelectUserToAdd = (selectedUser) => {
        setSelectedUsersToAdd(prev =>
            prev.some(u => u._id === selectedUser._id)
                ? prev.filter(u => u._id !== selectedUser._id)
                : [...prev, selectedUser]
        );
    };

    const handleConfirmAddMembers = async () => {
        if (selectedUsersToAdd.length === 0) {
            showNotification('No users selected to add.', 'info');
            return;
        }
        try {
            const newMemberIds = selectedUsersToAdd.map(u => u._id);
            await addGroupMembers(currentChat._id, newMemberIds, token);
            showNotification('Members added successfully!', 'success');
            setSelectedUsersToAdd([]);
            setAddMemberSearchQuery('');
            setAddMemberSearchResults([]);

            await fetchGroupMembers();
            onChatUpdate(currentChat._id); // Notify parent component (ChatsPage) about chat update
        } catch (error) {
            console.error('Error adding members:', error);
            showNotification(error.message || 'Failed to add members.', 'error');
        }
    };


    // Handle removing a member (initiates confirmation modal)
    const handleRemoveMemberClick = (memberId, username) => {
        setMemberToRemoveId(memberId);
        setMemberToRemoveUsername(username);
        setShowConfirmRemoveModal(true);
    };

    // Confirms and executes member removal
    const confirmRemoveMember = async () => {
        if (!memberToRemoveId) return;
        try {
            await removeGroupMember(currentChat._id, memberToRemoveId, token);
            showNotification('Member removed successfully!', 'success');
            await fetchGroupMembers();
            onChatUpdate(currentChat._id); // Notify parent component (ChatsPage) about chat update
            setShowConfirmRemoveModal(false);
            setMemberToRemoveId(null);
            setMemberToRemoveUsername('');
        } catch (error) {
            console.error('Error removing member:', error);
            showNotification(error.message || 'Failed to remove member.', 'error');
            setShowConfirmRemoveModal(false);
            setMemberToRemoveId(null);
            setMemberToRemoveUsername('');
        }
    };

    // Cancels member removal
    const cancelRemoveMember = () => {
        setShowConfirmRemoveModal(false);
        setMemberToRemoveId(null);
        setMemberToRemoveUsername('');
    };


    if (!currentChat) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="text-xl">Select a chat to start messaging.</p>
                <p className="text-sm">Or start a new private/group chat from the sidebar.</p>
            </div>
        );
    }

    // Determine chat display name and image
    const chatDisplayName = currentChat.type === 'private'
        ? currentChat.participants.find(p => p._id !== user._id)?.username || 'Unknown User'
        : currentChat.name;

    const chatDisplayImage = currentChat.type === 'private'
        ? currentChat.participants.find(p => p._id !== user._id)?.profilePicture || `https://placehold.co/40x40/374151/E5E7EB?text=${chatDisplayName ? chatDisplayName[0].toUpperCase() : '?'}`
        : `https://placehold.co/40x40/374151/E5E7EB?text=${chatDisplayName ? chatDisplayName[0].toUpperCase() : 'G'}`;


    return (
        <div className="flex flex-col h-full bg-gray-900 text-white">
            {/* Chat Header */}
            <div className="flex items-center p-4 bg-gray-800 border-b border-gray-700 shadow-md">
                <img
                    src={chatDisplayImage}
                    alt={chatDisplayName}
                    className="w-10 h-10 rounded-full mr-3 object-cover"
                    onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = `https://placehold.co/40x40/374151/E5E7EB?text=${chatDisplayName ? chatDisplayName[0].toUpperCase() : '?'}`;
                    }}
                />
                <h2 className="text-xl font-semibold">{chatDisplayName}</h2>
                {currentChat.type === 'group' && (
                    <button
                        onClick={() => setShowMembersModal(true)}
                        className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        {isCurrentUserAdmin ? 'Manage Members' : 'View Members'}
                    </button>
                )}
            </div>

            {/* Messages Area - NOW USES CHATMESSAGE COMPONENT */}
            <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                {loadingMessages ? (
                    <div className="text-center text-gray-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500">No messages yet. Say hi!</div>
                ) : (
                    messages.map((msg) => (
                        <ChatMessage
                            key={msg._id}
                            message={msg}
                            currentUser={user}
                        />
                    ))
                )}
                <div ref={messagesEndRef} /> {/* Scroll target */}
            </div>

            {/* Chat Input - Reverted to use ChatInput component */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
                {/* The message input and send button logic is handled by the ChatInput component.
                    To change the + icon and paper airplane icon, you would need to modify
                    the ChatInput.js file directly. I do not have access to that file.
                */}
                <ChatInput chatId={currentChat._id} onTextMessageSend={onSendMessage} />
            </div>

            {/* Members Modal */}
            {showMembersModal && currentChat.type === 'group' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
                            <h3 className="text-2xl font-bold text-white">Group Members ({groupMembers.length})</h3>
                            <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-white text-3xl font-bold">&times;</button>
                        </div>

                        {/* Current Members List */}
                        <div className="flex-grow overflow-y-auto custom-scrollbar mb-4 pr-2">
                            {groupMembers.length > 0 ? (
                                groupMembers.map(member => (
                                    <div key={member._id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700 transition-colors mb-2">
                                        <div className="flex items-center">
                                            <img
                                                src={member.profilePicture || `https://placehold.co/40x40/374151/E5E7EB?text=${member.username ? member.username[0].toUpperCase() : '?'}`}
                                                alt={member.username}
                                                className="w-10 h-10 rounded-full mr-3 object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null; // Prevent infinite loop
                                                    e.target.src = `https://placehold.co/40x40/374151/E5E7EB?text=${member.username ? member.username[0].toUpperCase() : '?'}`;
                                                }}
                                            />
                                            <span className="text-lg text-white">{member.username}</span>
                                            {currentChat.admins?.includes(member._id) && <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Admin</span>}
                                        </div>
                                        {isCurrentUserAdmin && member._id !== user._id && (
                                            <button
                                                onClick={() => handleRemoveMemberClick(member._id, member.username)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-center">No members found.</p>
                            )}
                        </div>

                        {/* Add Members Section (only for admins) */}
                        {isCurrentUserAdmin && (
                            <div className="border-t border-gray-700 pt-4 mt-4">
                                <h4 className="text-xl font-semibold mb-3 text-white">Add Members</h4>
                                <UserSearch
                                    query={addMemberSearchQuery}
                                    onSearchChange={handleAddMemberSearch}
                                    searchResults={addMemberSearchResults}
                                    onSelectUserForGroupChat={handleSelectUserToAdd} // This prop is used for adding to existing group
                                    selectedUsersForGroupChat={selectedUsersToAdd} // Pass selected users
                                    currentUser={user} // Pass currentUser
                                    showNotification={showNotification} // Pass showNotification
                                    isGroupCreationMode={true} // Indicate it's for group context to enable selection logic
                                    isAddingMembersToExistingGroup={true} // NEW: Indicate this is for adding to an existing group
                                    onAddMembersToExistingGroup={handleConfirmAddMembers} // NEW: Pass the handler for adding members
                                    // Omit props not relevant for this specific usage within the modal:
                                    // onCreateChat, chats, onInitiateGroupChat, onCancelGroupChat,
                                    // newGroupChatName, onNewGroupChatNameChange, onCreateGroupChat
                                />

                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modal for Remove Member */}
            {showConfirmRemoveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-xl font-bold text-white mb-4">Confirm Removal</h3>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to remove <span className="font-semibold text-white">{memberToRemoveUsername}</span> from this group?
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={cancelRemoveMember}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemoveMember}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWindow;