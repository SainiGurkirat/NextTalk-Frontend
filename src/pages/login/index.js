// frontend/pages/login/index.js
import { useEffect } from 'react';
import AuthForm from '../../components/AuthForm';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout'; // Assuming you have a Layout component

const LoginPage = () => {
  const { isAuthenticated, login } = useAuth(); // Assuming login is the function to set auth state
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chats'); // Redirect to chats page if already authenticated
    }
  }, [isAuthenticated, router]);

  // onAuthSuccess is a prop passed to AuthForm, which calls AuthContext's login function
  const handleLoginSuccess = (token) => {
    login(token); // Update AuthContext state
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