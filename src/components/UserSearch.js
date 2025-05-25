// frontend/components/UserSearch.js
import React from 'react';

const UserSearch = ({ query, onSearchChange, onSearchSubmit, searchResults, onCreateChat }) => {
  return (
    <form onSubmit={onSearchSubmit} className="relative">
      <input
        type="text"
        placeholder="Search users..."
        value={query}
        onChange={onSearchChange}
        className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
      />
    </form>
  );
};

export default UserSearch;