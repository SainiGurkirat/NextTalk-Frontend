import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Layout title="Welcome to NextTalk">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-1000 text-white p-4">
        <h1 className="text-5xl font-bold text-blue-500 mb-6 animate-pulse">
          Welcome to NextTalk!
        </h1>
        <p className="text-xl text-gray-300 mb-8 text-center max-w-2xl">
          Connect with your friends using NextTalk.
        </p>

        {isAuthenticated ? (
          <>
            <p className="text-lg text-gray-200 mb-4">
              Hello, {user?.username || 'user'}! You are logged in.
            </p>
            <Link href="/chats" className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-300">
              Go to Chats
            </Link>
          </>
        ) : (
          <div className="flex space-x-4">
            <Link href="/register" className="px-5 py-2 bg-green-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-green-300 transition-colors duration-300">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HomePage;