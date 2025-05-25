// frontend/pages/register/index.js
import { useEffect } from 'react';
import AuthForm from '../../components/AuthForm';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout'; // Assuming you have a Layout component

const RegisterPage = () => {
  const { isAuthenticated, login } = useAuth(); // Assuming login is the function to set auth state
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chats'); // Redirect to chats page if already authenticated
    }
  }, [isAuthenticated, router]);

  // onAuthSuccess is a prop passed to AuthForm, which calls AuthContext's login function
  const handleRegisterSuccess = (token) => {
    login(token); // Update AuthContext state (register usually logs you in immediately)
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <AuthForm formType="register" onAuthSuccess={handleRegisterSuccess} />
      </div>
    </Layout>
  );
};

export default RegisterPage;