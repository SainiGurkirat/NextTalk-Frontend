// frontend/components/AuthForm.js
import React, { useState } from 'react';
import Link from 'next/link';
import { loginUser, registerUser } from '../lib/api'; // Make sure this import is present

const AuthForm = ({ formType, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // Only for register
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isLogin = formType === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log(`Submitting ${isLogin ? 'Login' : 'Register'} Form:`);
    console.log('Email:', email);
    console.log('Password:', password);
    if (!isLogin) {
      console.log('Username:', username);
    }

    try {
      let data;
      if (isLogin) {
        data = await loginUser(email, password); // <--- UNCOMMENT THIS LINE
      } else {
        data = await registerUser(username, email, password); // <--- UNCOMMENT THIS LINE
      }

      if (data && data.token) {
        localStorage.setItem('token', data.token);
        onAuthSuccess(data.token);
      } else {
        throw new Error('Authentication successful but no token received.');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md mx-auto my-10">
      <h2 className="text-3xl font-bold text-white text-center mb-6">
        {isLogin ? 'Login' : 'Register'}
      </h2>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label htmlFor="username" className="block text-gray-300 text-sm font-bold mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required={!isLogin}
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">
            Password
  </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-300">
          {isLogin ? (
            <p>
              Need an account?{' '}
              <Link href="/register" className="text-blue-400 hover:underline">
                Register
              </Link>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:underline">
                Login
              </Link>
            </p>
          )}
        </div>
      </div>
    );
  };

export default AuthForm;