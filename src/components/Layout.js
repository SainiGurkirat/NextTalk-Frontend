// frontend/components/Layout.js
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

const Layout = ({ children, title = 'NextTalk' }) => {
  const router = useRouter();
  const pathname = router.pathname;
  const isLoginPage = pathname === '/login' || pathname === '/register';

  const { isAuthenticated, logout } = useAuth();  


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="bg-gray-900 p-4 flex justify-between items-center shadow-md">
        <Link href="/" className="text-2xl font-bold text-blue-500 hover:text-blue-400 transition-colors">
          NextTalk
        </Link>
        <nav>
        
         
          {!isLoginPage && isAuthenticated ? (
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          ) : ( !isLoginPage && (
            <Link href="/login" className="px-3 py-1.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
              Login
            </Link>
          )
          )}
          
        </nav>
      </header>

      <main className="flex-1">
        {children}
      </main>
      
    </div>
  );
};

export default Layout;