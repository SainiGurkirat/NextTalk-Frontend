import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ChatList from '../../components/ChatList';
import UserSearch from '../../components/UserSearch';
import { useAuth } from '../../context/AuthContext';
import { getChats } from '../../lib/api';

const ChatsPage = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchChats = async () => {
    if (!user) return; // Wait for user to be loaded
    setLoadingChats(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const fetchedChats = await getChats(token);
      setChats(fetchedChats);
    } catch (err) {
      setError('Failed to load chats. Please try again.');
      console.error('Fetch chats error:', err);
      // If token is invalid, log out
      if (err.message.includes('Invalid or expired token') || err.message.includes('Authentication token required')) {
        logout();
      }
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/'); // Redirect to login if not authenticated
    } else if (user) {
      fetchChats();
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <Layout title="Loading...">
        <div className="flex justify-center items-center h-screen">
          <p className="text-xl text-primary">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Your Chats">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Chats</h1>
        <div className="flex items-center space-x-4">
          <span className="text-lightText">Logged in as: <span className="font-semibold">{user.username}</span></span>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out"
          >
            Logout
          </button>
        </div>
      </div>

      <UserSearch currentUserId={user.id} onChatCreated={fetchChats} />

      {loadingChats ? (
        <p className="text-center text-lightText mt-8">Loading chats...</p>
      ) : error ? (
        <p className="text-center text-red-500 mt-8">{error}</p>
      ) : (
        <ChatList chats={chats} currentUserId={user.id} />
      )}
    </Layout>
  );
};

export default ChatsPage;