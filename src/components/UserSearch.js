// frontend/components/UserSearch.js
import React, { useState } from 'react';

const UserSearch = ({ query, onSearchChange, searchResults, onCreateChat, chats, currentUser, showNotification }) => { // NEW: showNotification prop
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupChatName, setGroupChatName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const handleSelectUserForGroup = (user) => {
    setSelectedUsers(prev =>
      prev.some(u => u._id === user._id)
        ? prev.filter(u => u._id !== user._id)
        : [...prev, user]
    );
  };

  const handleCreateGroupChat = () => {
    if (selectedUsers.length < 2) {
      showNotification('Please select at least two users for a group chat.', 'error'); // Using notification
      return;
    }
    if (!groupChatName.trim()) {
      showNotification('Please enter a name for the group chat.', 'error'); // Using notification
      return;
    }

    const participantIds = selectedUsers.map(u => u._id);
    onCreateChat(participantIds, 'group', groupChatName.trim());

    setSelectedUsers([]);
    setGroupChatName('');
    setIsCreatingGroup(false);
    onSearchChange({ target: { value: '' } });
  };

  const handleCreatePrivateChat = (userToChatWith) => {
    if (!currentUser || !chats) {
        showNotification('Error: User or chat data not available.', 'error'); // Using notification
        return;
    }

    const existingPrivateChat = chats.find(chat =>
      chat.type === 'private' &&
      chat.participants.length === 2 &&
      chat.participants.some(p => p._id === currentUser._id) &&
      chat.participants.some(p => p._id === userToChatWith._id)
    );

    if (existingPrivateChat) {
      // Use the new showNotification function for the "already in contacts" message
      showNotification(`${userToChatWith.username} is already in your contacts!`, 'warning'); // 'warning' or custom type for yellow
      onCreateChat([userToChatWith._id], 'private', '', existingPrivateChat._id);
      setSelectedUsers([]);
      setGroupChatName('');
      setIsCreatingGroup(false);
      onSearchChange({ target: { value: '' } });
      return;
    }

    onCreateChat([userToChatWith._id], 'private');

    setSelectedUsers([]);
    setGroupChatName('');
    setIsCreatingGroup(false);
    onSearchChange({ target: { value: '' } });
  };


  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search users..."
        value={query}
        onChange={(e) => {
            onSearchChange(e);
        }}
        className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
      />

      {!isCreatingGroup && query.length > 0 && searchResults.length > 0 && (
          <button
              onClick={() => setIsCreatingGroup(true)}
              className="mt-2 w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
              Start Group Chat
          </button>
      )}

      {isCreatingGroup && (
        <div className="mt-4 p-3 bg-gray-700 rounded-md border border-gray-600">
          <h3 className="text-white text-lg font-semibold mb-2">Create Group Chat</h3>
          <input
            type="text"
            placeholder="Group Chat Name"
            value={groupChatName}
            onChange={(e) => setGroupChatName(e.target.value)}
            className="w-full p-2 mb-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <div className="text-white mb-2">
            Selected Participants: ({selectedUsers.length})
            {selectedUsers.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedUsers.map(user => (
                  <span key={user._id} className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center max-w-[calc(50%-8px)] sm:max-w-[150px] overflow-hidden whitespace-nowrap text-ellipsis">
                    {user.username}
                    <button
                      onClick={() => handleSelectUserForGroup(user)}
                      className="ml-1 text-xs font-bold text-white hover:text-gray-200"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 block text-sm">None selected yet. Select from search results below.</span>
            )}
          </div>
          <button
            onClick={handleCreateGroupChat}
            disabled={selectedUsers.length < 2 || !groupChatName.trim()}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Group Chat
          </button>
          <button
            onClick={() => {
                setIsCreatingGroup(false);
                setSelectedUsers([]);
                setGroupChatName('');
                onSearchChange({ target: { value: '' } });
            }}
            className="mt-2 w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}


      {searchResults.length > 0 && (
        <div className="mt-2 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
          {searchResults.map(resultUser => (
            <div key={resultUser._id} className="p-2 border-b border-gray-600 last:border-b-0 hover:bg-gray-600 cursor-pointer flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0">
                {resultUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col flex-grow min-w-0">
                <span className="text-white font-medium truncate">{resultUser.username}</span>
                <span className="text-gray-400 text-sm truncate">{resultUser.email}</span>
              </div>

              <div className="flex-shrink-0 ml-auto">
                  {isCreatingGroup ? (
                      <button
                          onClick={() => handleSelectUserForGroup(resultUser)}
                          className={`ml-2 px-3 py-1 rounded-md text-sm transition-colors ${
                              selectedUsers.some(u => u._id === resultUser._id)
                                  ? 'bg-red-500 hover:bg-red-600 text-white'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                      >
                          {selectedUsers.some(u => u._id === resultUser._id) ? 'Deselect' : 'Select'}
                      </button>
                  ) : (
                      <button
                        onClick={() => handleCreatePrivateChat(resultUser)}
                        className="ml-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        Chat
                      </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearch;