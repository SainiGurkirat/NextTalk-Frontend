// frontend/components/UserSearch.js
import React from 'react';

// Props: query, onSearchChange, onSearchSubmit, searchResults, onCreateChat
const UserSearch = ({ query, onSearchChange, onSearchSubmit, searchResults, onCreateChat }) => {
  return (
    <div className="p-4 border-b border-gray-700 bg-gray-800">
      {/* Form for user search input */}
      <form onSubmit={onSearchSubmit} className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={query} // Use 'query' prop here
          onChange={onSearchChange}
          className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      {/* Display search results if available */}
      {searchResults && searchResults.length > 0 && (
        <div className="bg-gray-700 rounded-md max-h-48 overflow-y-auto custom-scrollbar">
          <ul>
            {searchResults.map((user) => (
              <li
                key={user._id} // Assuming backend returns _id for users
                onClick={() => onCreateChat(user._id)} // Pass user._id to create chat
                className="flex items-center p-3 cursor-pointer hover:bg-gray-600 transition-colors duration-200"
              >
                {/* User's initial avatar */}
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-md font-bold mr-3">
                  {user.username ? user.username[0].toUpperCase() : ''}
                </div>
                {/* User's username and email */}
                <span className="text-white">{user.username}</span>
                <span className="text-gray-400 ml-2 text-sm">({user.email})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Message when no users are found after a search query is typed */}
      {/* Ensure 'query' is not undefined before calling .trim() */}
      {query && query.trim() && searchResults.length === 0 && (
        <p className="text-gray-400 text-center p-4">No users found.</p>
      )}
    </div>
  );
};

export default UserSearch;