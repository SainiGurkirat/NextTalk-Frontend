// frontend/components/GroupMemberManager.js
import React, { useState, useEffect, useCallback } from 'react';
import { getGroupMembers, addGroupMembers, removeGroupMember, searchUsers } from '../lib/api';
// import styles from '../styles/GroupMemberManager.module.css'; // REMOVE THIS LINE
// import SearchUser from './SearchUser'; // REMOVE THIS LINE - SearchUser is no longer used/exists

const GroupMemberManager = ({ chat, currentUser, token, onClose, showNotification, onChatUpdate }) => {
  const [currentMembers, setCurrentMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]); // Users selected from search results

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const members = await getGroupMembers(chat._id, token);
      setCurrentMembers(members);
    } catch (error) {
      console.error('Failed to fetch group members:', error);
      showNotification(error.message || 'Failed to load group members.', 'error');
    } finally {
      setLoadingMembers(false);
    }
  }, [chat._id, token, showNotification]);

  useEffect(() => {
    if (chat && token) {
      fetchMembers();
    }
  }, [chat, token, fetchMembers]);

  const handleSearchInputChange = useCallback(async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await searchUsers(query, token);
      // Filter out current members and self from search results
      const filtered = data.filter(u =>
        !currentMembers.some(member => member._id === u._id) && u._id !== currentUser._id
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('User search error:', error);
      showNotification(error.message || 'Failed to search users.', 'error');
    }
  }, [token, currentMembers, currentUser, showNotification]);

  const handleSelectUserToAdd = (user) => {
    setSelectedUsersToAdd(prev =>
      prev.some(u => u._id === user._id)
        ? prev.filter(u => u._id !== user._id)
        : [...prev, user]
    );
  };

  const handleAddSelectedMembers = async () => {
    if (selectedUsersToAdd.length === 0) {
      showNotification('Please select users to add.', 'warning');
      return;
    }
    const memberIds = selectedUsersToAdd.map(u => u._id);
    try {
      await addGroupMembers(chat._id, memberIds, token);
      showNotification('Members added successfully!', 'success');
      setSelectedUsersToAdd([]);
      setSearchQuery('');
      setSearchResults([]);
      fetchMembers(); // Re-fetch current members
      onChatUpdate(chat._id); // Notify parent to update chat details
    } catch (error) {
      console.error('Failed to add members:', error);
      showNotification(error.message || 'Failed to add members.', 'error');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (memberId === currentUser._id) {
      showNotification("You cannot remove yourself this way. Use 'Leave Group' if available.", 'warning');
      return;
    }
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeGroupMember(chat._id, memberId, token);
        showNotification('Member removed successfully!', 'success');
        fetchMembers(); // Re-fetch current members
        onChatUpdate(chat._id); // Notify parent to update chat details
      } catch (error) {
        console.error('Failed to remove member:', error);
        showNotification(error.message || 'Failed to remove member.', 'error');
      }
    }
  };

  const isAdmin = chat.admin && chat.admin._id === currentUser._id;

  return (
    // Modal Overlay (Tailwind CSS for fixed, full-screen overlay)
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      {/* Modal Content (Tailwind CSS for card-like structure) */}
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Manage Group Members: {chat.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Current Members Section */}
        <div className="p-4 flex-grow overflow-y-auto custom-scrollbar">
          <h3 className="text-lg font-medium text-white mb-3">Current Members:</h3>
          {loadingMembers ? (
            <p className="text-gray-400">Loading members...</p>
          ) : (
            <ul className="space-y-2">
              {currentMembers.map(member => (
                <li key={member._id} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white">
                      {member.username}
                      {member._id === chat.admin?._id && <span className="ml-2 text-purple-400 text-sm">(Admin)</span>}
                      {member._id === currentUser._id && <span className="ml-2 text-green-400 text-sm">(You)</span>}
                    </span>
                  </div>
                  {isAdmin && member._id !== currentUser._id && (
                    <button
                      onClick={() => handleRemoveMember(member._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Add Members Section */}
          {isAdmin && (
            <div className="mt-6 border-t border-gray-700 pt-4">
              <h3 className="text-lg font-medium text-white mb-3">Add New Members:</h3>
              <input
                type="text"
                placeholder="Search users to add..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500 mb-2"
              />

              {selectedUsersToAdd.length > 0 && (
                <div className="text-white mb-2">
                  Selected to Add: ({selectedUsersToAdd.length})
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedUsersToAdd.map(user => (
                      <span key={user._id} className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center max-w-[calc(50%-8px)] sm:max-w-[150px] overflow-hidden whitespace-nowrap text-ellipsis">
                        {user.username}
                        <button
                          onClick={() => handleSelectUserToAdd(user)}
                          className="ml-1 text-xs font-bold text-white hover:text-gray-200"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="mt-2 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto custom-scrollbar">
                  {searchResults.map(resultUser => (
                    <div
                      key={resultUser._id}
                      className="p-2 border-b border-gray-600 last:border-b-0 hover:bg-gray-600 cursor-pointer flex items-center"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0">
                        {resultUser.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col flex-grow min-w-0">
                        <span className="text-white font-medium truncate">{resultUser.username}</span>
                        <span className="text-gray-400 text-sm truncate">{resultUser.email}</span>
                      </div>
                      <button
                        onClick={() => handleSelectUserToAdd(resultUser)}
                        className={`ml-2 px-3 py-1 rounded-md text-sm transition-colors ${
                          selectedUsersToAdd.some(u => u._id === resultUser._id)
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {selectedUsersToAdd.some(u => u._id === resultUser._id) ? 'Deselect' : 'Select'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleAddSelectedMembers}
                disabled={selectedUsersToAdd.length === 0}
                className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Selected Members
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupMemberManager;