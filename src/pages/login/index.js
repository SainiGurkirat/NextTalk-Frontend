// frontend/pages/login/index.js
import { useEffect } from 'react';
import AuthForm from '../../components/AuthForm';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

const LoginPage = () => {
  const { isAuthenticated, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chats'); // redirect to chats page if already authenticated
    }
  }, [isAuthenticated, router]);

  const handleLoginSuccess = (token) => {
    login(token); // update authContext state
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <AuthForm formType="login" onAuthSuccess={handleLoginSuccess} />
      </div>
    </Layout>
  );
};

export default LoginPage;