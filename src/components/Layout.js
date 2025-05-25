// frontend/components/Layout.js
import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children, title = 'NextTalk' }) => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header/Navbar */}
      <header className="bg-gray-800 p-4 flex justify-between items-center shadow-md">
        <Link href="/" className="text-2xl font-bold text-blue-500 hover:text-blue-400 transition-colors">
          {/* Simplified header text */}
          NextTalk
        </Link>
        <nav>
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
              Login
            </Link>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer (optional) */}
      {/* <footer className="bg-gray-800 p-4 text-center text-gray-500">
        © {new Date().getFullYear()} NextTalk
      </footer> */}
    </div>
  );
};

export default Layout;