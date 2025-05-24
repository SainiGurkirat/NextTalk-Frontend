import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AuthForm from '../components/AuthForm';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login, register, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/chats'); // Redirect to chats if already logged in
    }
  }, [user, authLoading, router]);

  const handleAuthSubmit = async (credentials) => {
    setMessage('');
    setIsLoading(true);
    let result;
    if (isRegister) {
      result = await register(credentials);
      if (result.success) {
        setMessage('Registration successful! Please login.');
        setIsRegister(false); // Switch to login form
      } else {
        setMessage(result.error || 'Registration failed.');
      }
    } else {
      result = await login(credentials);
      if (!result.success) {
        setMessage(result.error || 'Login failed.');
      }
    }
    setIsLoading(false);
  };

  if (authLoading || user) {
    return (
      <Layout title="Loading...">
        <div className="flex justify-center items-center h-screen">
          <p className="text-xl text-primary">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isRegister ? 'Register' : 'Login'}>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] py-12">
        {message && (
          <div className={`p-3 mb-4 rounded-md ${message.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}
        <AuthForm isRegister={isRegister} onSubmit={handleAuthSubmit} isLoading={isLoading} />
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="mt-4 text-primary hover:underline text-sm"
        >
          {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </div>
    </Layout>
  );
};

export default AuthPage;