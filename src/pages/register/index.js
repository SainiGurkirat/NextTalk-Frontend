// frontend/pages/register/index.js (Corrected version)
import React from 'react';
import AuthForm from '../../components/AuthForm';
import { useRouter } from 'next/router'; // Import useRouter
import Layout from '../../components/Layout'; 

const RegisterPage = () => {
    const router = useRouter();

    const handleRegisterSuccess = (token) => {
        // A token might be returned by register if your backend sends it,
        // but the primary goal after register is usually to prompt login.
        // You could optionally save the token here if you want to auto-login.
        // For now, let's redirect to login.
        console.log("[REGISTER PAGE] Registration successful, redirecting to login.");
        router.push('/login?registered=true'); // Redirect to login page, add query param for message
    };

    return (
        <Layout >
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <AuthForm formType="register" onAuthSuccess={handleRegisterSuccess} />
        </div>
        </Layout>
    );
};

export default RegisterPage;
