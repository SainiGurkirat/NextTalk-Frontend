import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatMessage from './ChatMessage'; 
import ChatInput from './ChatInput';
import { getGroupMembers, addGroupMembers, removeGroupMember, searchUsers } from '../lib/api';
import UserSearch from './UserSearch'; // reuse usersearch for adding members

const ChatWindow = ({ currentChat, messages, user, onSendMessage, loadingMessages, showNotification, token, onChatUpdate }) => {
    const messagesEndRef = useRef(null);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [groupMembers, setGroupMembers] = useState([]);
    const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

    // state for adding members via search within the modal
    const [addMemberSearchQuery, setAddMemberSearchQuery] = useState('');
    const [addMemberSearchResults, setAddMemberSearchResults] = useState([]);
    const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);

    // state for custom confirmation dialog for removing members
    const [showConfirmRemoveModal, setShowConfirmRemoveModal] = useState(false);
    const [memberToRemoveId, setMemberToRemoveId] = useState(null);
    const [memberToRemoveUsername, setMemberToRemoveUsername] = useState('');


    // scrolls to the latest message whenever messages or the currentchat changes
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
        }
    }, [messages, currentChat]);

    // checks if current user is an admin whenever currentchat or user changes
    useEffect(() => {
        if (currentChat && user && currentChat.type === 'group') {
            setIsCurrentUserAdmin(currentChat.admins?.includes(user._id));
        } else {
            setIsCurrentUserAdmin(false);
        }
    }, [currentChat, user]);


    // function to fetch and update group members
    const fetchGroupMembers = useCallback(async () => {
        if (currentChat && currentChat.type === 'group' && token) {
            try {
                const members = await getGroupMembers(currentChat._id, token);
                setGroupMembers(members);
            } catch (error) {
                console.error('failed to fetch group members:', error);
                showNotification(error.message || 'failed to load group members.', 'error');
            }
        }
    }, [currentChat, token, showNotification]);

    // fetches members when modal opens or current chat changes
    useEffect(() => {
        if (showMembersModal && currentChat && currentChat.type === 'group') {
            fetchGroupMembers();
        }
    }, [showMembersModal, currentChat, fetchGroupMembers]);


    // handles search input for adding new members
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
            // filter out current members and self from search results
            const filtered = data.filter(u => u._id !== user._id && !currentMemberIds.has(u._id));
            setAddMemberSearchResults(filtered);
        } catch (error) {
            console.error('add member search error:', error);
            showNotification(error.message || 'failed to search users to add.', 'error');
        }
    }, [token, user, groupMembers, showNotification]);

    // toggles user selection for adding to the group
    const handleSelectUserToAdd = (selectedUser) => {
        setSelectedUsersToAdd(prev =>
            prev.some(u => u._id === selectedUser._id)
                ? prev.filter(u => u._id !== selectedUser._id)
                : [...prev, selectedUser]
        );
    };

    // confirms and executes adding selected members to the group
    const handleConfirmAddMembers = async () => {
        if (selectedUsersToAdd.length === 0) {
            showNotification('no users selected to add.', 'info');
            return;
        }
        try {
            const newMemberIds = selectedUsersToAdd.map(u => u._id);
            await addGroupMembers(currentChat._id, newMemberIds, token);
            showNotification('members added successfully!', 'success');
            setSelectedUsersToAdd([]);
            setAddMemberSearchQuery('');
            setAddMemberSearchResults([]);

            await fetchGroupMembers(); // refetch members list
            onChatUpdate(currentChat._id); // notify parent component (chatspage) about chat update
        } catch (error) {
            console.error('error adding members:', error);
            showNotification(error.message || 'failed to add members.', 'error');
        }
    };


    // handles click to remove a member, opens confirmation modal
    const handleRemoveMemberClick = (memberId, username) => {
        setMemberToRemoveId(memberId);
        setMemberToRemoveUsername(username);
        setShowConfirmRemoveModal(true);
    };

    // confirms and executes member removal after user confirmation
    const confirmRemoveMember = async () => {
        if (!memberToRemoveId) return;
        try {
            await removeGroupMember(currentChat._id, memberToRemoveId, token);
            showNotification('member removed successfully!', 'success');
            await fetchGroupMembers(); // refetch members list
            onChatUpdate(currentChat._id); // notify parent component (chatspage) about chat update
            setShowConfirmRemoveModal(false);
            setMemberToRemoveId(null);
            setMemberToRemoveUsername('');
        } catch (error) {
            console.error('error removing member:', error);
            showNotification(error.message || 'failed to remove member.', 'error');
            setShowConfirmRemoveModal(false);
            setMemberToRemoveId(null);
            setMemberToRemoveUsername('');
        }
    };

    // cancels member removal
    const cancelRemoveMember = () => {
        setShowConfirmRemoveModal(false);
        setMemberToRemoveId(null);
        setMemberToRemoveUsername('');
    };


    // displays a prompt if no chat is selected
    if (!currentChat) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="text-xl">select a chat to start messaging.</p>
                <p className="text-sm">or start a new private/group chat from the sidebar.</p>
            </div>
        );
    }

    // determines chat display name and image based on chat type
    const chatDisplayName = currentChat.type === 'private'
        ? currentChat.participants.find(p => p._id !== user._id)?.username || 'unknown user'
        : currentChat.name;

    const chatDisplayImage = currentChat.type === 'private'
        ? currentChat.participants.find(p => p._id !== user._id)?.profilePicture || `https://placehold.co/40x40/374151/E5E7EB?text=${chatDisplayName ? chatDisplayName[0].toUpperCase() : '?'}`
        : `https://placehold.co/40x40/374151/E5E7EB?text=${chatDisplayName ? chatDisplayName[0].toUpperCase() : 'g'}`;


    return (
        <div className="flex flex-col h-full bg-gray-900 text-white">
            {/* chat header */}
            <div className="flex items-center p-4 bg-gray-800 border-b border-gray-700 shadow-md">
                <img
                    src={chatDisplayImage}
                    alt={chatDisplayName}
                    className="w-10 h-10 rounded-full mr-3 object-cover"
                    onError={(e) => {
                        e.target.onerror = null; // prevent infinite loop
                        e.target.src = `https://placehold.co/40x40/374151/E5E7EB?text=${chatDisplayName ? chatDisplayName[0].toUpperCase() : '?'}`;
                    }}
                />
                <h2 className="text-xl font-semibold">{chatDisplayName}</h2>
                {/* manage/view members button for group chats */}
                {currentChat.type === 'group' && (
                    <button
                        onClick={() => setShowMembersModal(true)}
                        className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        {isCurrentUserAdmin ? 'manage members' : 'view members'}
                    </button>
                )}
            </div>

            {/* messages area, displays chatmessage components */}
            <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                {loadingMessages ? (
                    <div className="text-center text-gray-500">loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500">no messages yet. say hi!</div>
                ) : (
                    messages.map((msg) => (
                        <ChatMessage
                            key={msg._id}
                            message={msg}
                            currentUser={user}
                        />
                    ))
                )}
                <div ref={messagesEndRef} /> {/* scroll target */}
            </div>

            {/* chat input component */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
                <ChatInput chatId={currentChat._id} onTextMessageSend={onSendMessage} />
            </div>

            {/* members modal, displayed for group chats */}
            {showMembersModal && currentChat.type === 'group' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
                            <h3 className="text-2xl font-bold text-white">group members ({groupMembers.length})</h3>
                            <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-white text-3xl font-bold">&times;</button>
                        </div>

                        {/* current members list in the modal */}
                        <div className="flex-grow overflow-y-auto custom-scrollbar mb-4 pr-2">
                            {groupMembers.length > 0 ? (
                                groupMembers.map(member => (
                                    <div key={member._id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700 transition-colors mb-2">
                                        <div className="flex items-center">
                                            {/* member's profile picture */}
                                            <img
                                                src={member.profilePicture || `https://placehold.co/40x40/374151/E5E7EB?text=${member.username ? member.username[0].toUpperCase() : '?'}`}
                                                alt={member.username}
                                                className="w-10 h-10 rounded-full mr-3 object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null; // prevent infinite loop
                                                    e.target.src = `https://placehold.co/40x40/374151/E5E7EB?text=${member.username ? member.username[0].toUpperCase() : '?'}`;
                                                }}
                                            />
                                            <span className="text-lg text-white">{member.username}</span>
                                            {currentChat.admins?.includes(member._id) && <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">admin</span>}
                                        </div>
                                        {/* remove member button, only for admin and not self */}
                                        {isCurrentUserAdmin && member._id !== user._id && (
                                            <button
                                                onClick={() => handleRemoveMemberClick(member._id, member.username)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
                                            >
                                                remove
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-center">no members found.</p>
                            )}
                        </div>

                        {/* add members section (only for admins) */}
                        {isCurrentUserAdmin && (
                            <div className="border-t border-gray-700 pt-4 mt-4">
                                <h4 className="text-xl font-semibold mb-3 text-white">add members</h4>
                                {/* user search component for adding members */}
                                <UserSearch
                                    query={addMemberSearchQuery}
                                    onSearchChange={handleAddMemberSearch}
                                    searchResults={addMemberSearchResults}
                                    onSelectUserForGroupChat={handleSelectUserToAdd}
                                    selectedUsersForGroupChat={selectedUsersToAdd}
                                    currentUser={user}
                                    showNotification={showNotification}
                                    isGroupCreationMode={true} // indicates it's for group context
                                    isAddingMembersToExistingGroup={true} // indicates adding to existing group
                                    onAddMembersToExistingGroup={handleConfirmAddMembers} // handler for adding members
                                />

                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* custom confirmation modal for remove member */}
            {showConfirmRemoveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-xl font-bold text-white mb-4">confirm removal</h3>
                        <p className="text-gray-300 mb-6">
                            are you sure you want to remove <span className="font-semibold text-white">{memberToRemoveUsername}</span> from this group?
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={cancelRemoveMember}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                            >
                                cancel
                            </button>
                            <button
                                onClick={confirmRemoveMember}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                            >
                                remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWindow;