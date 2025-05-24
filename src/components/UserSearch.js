import { useState } from 'react';
import { searchUsers, createChat } from '../lib/api';
import { useRouter } from 'next/router';

const UserSearch = ({ currentUserId, onChatCreated }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const users = await searchUsers(searchTerm, token);
      setSearchResults(users);
    } catch (err) {
      setError('Failed to search users. Please try again.');
      console.error('User search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async (targetUserId) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await createChat([currentUserId, targetUserId], 'private', null, token);
      if (response.chat) {
        onChatCreated(); // Notify parent to refresh chat list
        router.push(`/chats/${response.chat._id}`);
      } else {
        // This case handles when a private chat already exists and the backend returns it
        router.push(`/chats/${response.chat._id}`);
      }
    } catch (err) {
      setError('Failed to create chat. Please try again.');
      console.error('Create chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-xl font-semibold mb-4 text-primary">Start a New Chat</h3>
      <form onSubmit={handleSearch} className="flex mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users by username or email..."
          className="flex-1 p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary mr-2"
        />
        <button
          type="submit"
          className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {searchResults.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h4 className="font-medium text-lightText mb-2">Search Results:</h4>
          <ul className="space-y-2">
            {searchResults.map((user) => (
              <li key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="font-medium">{user.username} ({user.email})</span>
                <button
                  onClick={() => handleCreateChat(user._id)}
                  className="bg-accent hover:bg-green-600 text-white text-sm py-1.5 px-3 rounded-md transition duration-200 ease-in-out disabled:opacity-50"
                  disabled={loading}
                >
                  Chat
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {searchTerm.trim() && !loading && searchResults.length === 0 && (
        <p className="text-lightText text-sm mt-4">No users found matching your search.</p>
      )}
    </div>
  );
};

export default UserSearch;