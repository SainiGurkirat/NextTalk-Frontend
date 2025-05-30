// frontend/pages/settings/index.js
import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import {
    updateUserProfilePicture,
    updateUsername,
    updateEmail,
    updatePassword,
    checkUsernameAvailability,
    checkEmailAvailability
} from '../../lib/api';
import Notification from '../../components/Notification';

const SettingsPage = () => {
    const router = useRouter();
    const { user, isAuthenticated, token, refreshUser } = useAuth();
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('info');
    const [showNotification, setShowNotification] = useState(false);

    // profile picture states
    const [pfpFile, setPfpFile] = useState(null);
    const [pfpPreview, setPfpPreview] = useState(user?.profilePicture || '');
    const [pfpLoading, setPfpLoading] = useState(false);
    const pfpFileInputRef = useRef(null);

    // username states
    const [newUsername, setNewUsername] = useState(user?.username || '');
    const [usernameLoading, setUsernameLoading] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const usernameTimeoutRef = useRef(null);

    // email states
    const [newEmail, setNewEmail] = useState(user?.email || '');
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const emailTimeoutRef = useRef(null);

    // password states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    // display a notification
    const displayNotification = useCallback((msg, type = 'info') => {
        setNotificationMessage(msg);
        setNotificationType(type);
        setShowNotification(true);
        const timer = setTimeout(() => {
            setShowNotification(false);
            setNotificationMessage('');
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    // handle profile picture file change
    const handlePfpFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPfpFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPfpPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPfpFile(null);
            setPfpPreview(user?.profilePicture || '');
        }
    };

    // update profile picture
    const handleUpdateProfilePicture = useCallback(async (e) => {
        e.preventDefault();
        if (!pfpFile || !isAuthenticated || !token) {
            displayNotification('please select a file to upload.', 'warning');
            return;
        }

        setPfpLoading(true);
        try {
            const formData = new FormData();
            formData.append('profilePicture', pfpFile);
            await updateUserProfilePicture(formData, token);
            displayNotification('profile picture updated successfully!', 'success');
            setPfpFile(null);
            if (pfpFileInputRef.current) {
                pfpFileInputRef.current.value = '';
            }
            if (refreshUser) refreshUser();
            else displayNotification('refresh page to see updated profile picture.', 'info');

        } catch (error) {
            console.error('failed to update profile picture:', error);
            displayNotification(error.message || 'failed to update profile picture.', 'error');
            setPfpPreview(user?.profilePicture || '');
        } finally {
            setPfpLoading(false);
        }
    }, [pfpFile, isAuthenticated, token, displayNotification, user, refreshUser]);

    // handle username input change with availability check
    const handleUsernameChange = useCallback((e) => {
        const value = e.target.value;
        setNewUsername(value);
        setUsernameError('');

        if (usernameTimeoutRef.current) {
            clearTimeout(usernameTimeoutRef.current);
        }

        if (value && value !== user?.username) {
            usernameTimeoutRef.current = setTimeout(async () => {
                try {
                    const isAvailable = await checkUsernameAvailability(value);
                    if (!isAvailable) {
                        setUsernameError('username is already taken.');
                    }
                } catch (error) {
                    console.error('username availability check failed:', error);
                    setUsernameError('failed to check username availability.');
                }
            }, 500);
        }
    }, [user]);

    // update username
    const handleUpdateUsername = useCallback(async (e) => {
        e.preventDefault();
        if (!newUsername.trim() || newUsername === user?.username) {
            displayNotification('username is empty or unchanged.', 'warning');
            return;
        }
        if (usernameError) {
            displayNotification('please fix username errors before saving.', 'error');
            return;
        }
        if (!isAuthenticated || !token) {
            displayNotification('authentication required.', 'error');
            return;
        }

        setUsernameLoading(true);
        try {
            await updateUsername(newUsername, token);
            displayNotification('username updated successfully!', 'success');
            if (refreshUser) refreshUser();
            else displayNotification('refresh page to see updated username.', 'info');
        } catch (error) {
            console.error('failed to update username:', error);
            setUsernameError(error.message || 'failed to update username.');
            displayNotification(error.message || 'failed to update username.', 'error');
        } finally {
            setUsernameLoading(false);
        }
    }, [newUsername, usernameError, isAuthenticated, token, displayNotification, user, refreshUser]);

    // handle email input change with availability check
    const handleEmailChange = useCallback((e) => {
        const value = e.target.value;
        setNewEmail(value);
        setEmailError('');

        if (emailTimeoutRef.current) {
            clearTimeout(emailTimeoutRef.current);
        }

        if (value && value !== user?.email) {
            emailTimeoutRef.current = setTimeout(async () => {
                try {
                    const isAvailable = await checkEmailAvailability(value);
                    if (!isAvailable) {
                        setEmailError('email is already registered.');
                    }
                } catch (error) {
                    console.error('email availability check failed:', error);
                    setEmailError('failed to check email availability.');
                }
            }, 500);
        }
    }, [user]);

    // update email
    const handleUpdateEmail = useCallback(async (e) => {
        e.preventDefault();
        if (!newEmail.trim() || newEmail === user?.email) {
            displayNotification('email is empty or unchanged.', 'warning');
            return;
        }
        if (emailError) {
            displayNotification('please fix email errors before saving.', 'error');
            return;
        }
        if (!isAuthenticated || !token) {
            displayNotification('authentication required.', 'error');
            return;
        }

        setEmailLoading(true);
        try {
            await updateEmail(newEmail, token);
            displayNotification('email updated successfully!', 'success');
            if (refreshUser) refreshUser();
            else displayNotification('refresh page to see updated email.', 'info');
        } catch (error) {
            console.error('failed to update email:', error);
            setEmailError(error.message || 'failed to update email.');
            displayNotification(error.message || 'failed to update email.', 'error');
        } finally {
            setEmailLoading(false);
        }
    }, [newEmail, emailError, isAuthenticated, token, displayNotification, user, refreshUser]);

    // update password
    const handleUpdatePassword = useCallback(async (e) => {
        e.preventDefault();
        setPasswordError('');

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setPasswordError('all password fields are required.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setPasswordError('new password and confirmation do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('new password must be at least 6 characters long.');
            return;
        }
        if (!isAuthenticated || !token) {
            displayNotification('authentication required.', 'error');
            return;
        }

        setPasswordLoading(true);
        try {
            await updatePassword(currentPassword, newPassword, token);
            displayNotification('password updated successfully!', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error) {
            console.error('failed to update password:', error);
            setPasswordError(error.message || 'failed to update password.');
            displayNotification(error.message || 'failed to update password.', 'error');
        } finally {
            setPasswordLoading(false);
        }
    }, [currentPassword, newPassword, confirmNewPassword, isAuthenticated, token, displayNotification]);

    // render authentication message if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900 text-white text-xl">
                please log in to view settings.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 relative">
            {showNotification && (
                <Notification
                    message={notificationMessage}
                    type={notificationType}
                    onClose={() => setShowNotification(false)}
                />
            )}

            {/* back button */}
            <button
                onClick={() => router.push('/chats')}
                className="absolute top-8 left-8 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-semibold transition-colors flex items-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                back to chats
            </button>

            <h1 className="text-4xl font-bold mb-8 text-center">settings</h1>

            <div className="max-w-3xl mx-auto space-y-8">
                {/* profile picture section */}
                <section className="bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">profile picture</h2>
                    <form onSubmit={handleUpdateProfilePicture} className="flex flex-col items-center">
                        <img
                            src={pfpPreview || user?.profilePicture || `https://placehold.co/100x100/374151/E5E7EB?text=${user?.username ? user.username[0].toUpperCase() : '?'}`}
                            alt="profile preview"
                            className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-gray-600"
                        />
                        <input
                            type="file"
                            ref={pfpFileInputRef}
                            accept="image/*"
                            onChange={handlePfpFileChange}
                            className="block w-full text-sm text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-500 file:text-white
                                hover:file:bg-blue-600 cursor-pointer"
                        />
                        <button
                            type="submit"
                            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold transition-colors disabled:opacity-50"
                            disabled={pfpLoading || !pfpFile}
                        >
                            {pfpLoading ? 'uploading...' : 'update picture'}
                        </button>
                    </form>
                </section>

                {/* username section */}
                <section className="bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">change username</h2>
                    <form onSubmit={handleUpdateUsername}>
                        <div className="mb-4">
                            <label htmlFor="username" className="block text-gray-300 text-sm font-bold mb-2">
                                new username
                            </label>
                            <input
                                type="text"
                                id="username"
                                className={`shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 ${usernameError ? 'border-red-500' : ''}`}
                                value={newUsername}
                                onChange={handleUsernameChange}
                                required
                            />
                            {usernameError && <p className="text-red-500 text-xs italic mt-2">{usernameError}</p>}
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold transition-colors disabled:opacity-50"
                            disabled={usernameLoading || !newUsername.trim() || newUsername === user?.username || !!usernameError}
                        >
                            {usernameLoading ? 'updating...' : 'update username'}
                        </button>
                    </form>
                </section>

                {/* email section */}
                <section className="bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">change email</h2>
                    <form onSubmit={handleUpdateEmail}>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
                                new email
                            </label>
                            <input
                                type="email"
                                id="email"
                                className={`shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 ${emailError ? 'border-red-500' : ''}`}
                                value={newEmail}
                                onChange={handleEmailChange}
                                required
                            />
                            {emailError && <p className="text-red-500 text-xs italic mt-2">{emailError}</p>}
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold transition-colors disabled:opacity-50"
                            disabled={emailLoading || !newEmail.trim() || newEmail === user?.email || !!emailError}
                        >
                            {emailLoading ? 'updating...' : 'update email'}
                        </button>
                    </form>
                </section>

                {/* password section */}
                <section className="bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">change password</h2>
                    <form onSubmit={handleUpdatePassword}>
                        <div className="mb-4">
                            <label htmlFor="current-password" className="block text-gray-300 text-sm font-bold mb-2">
                                current password
                            </label>
                            <input
                                type="password"
                                id="current-password"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="new-password" className="block text-gray-300 text-sm font-bold mb-2">
                                new password
                            </label>
                            <input
                                type="password"
                                id="new-password"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="confirm-new-password" className="block text-gray-300 text-sm font-bold mb-2">
                                confirm new password
                            </label>
                            <input
                                type="password"
                                id="confirm-new-password"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                            />
                            {passwordError && <p className="text-red-500 text-xs italic mt-2">{passwordError}</p>}
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold transition-colors disabled:opacity-50"
                            disabled={passwordLoading || !currentPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                        >
                            {passwordLoading ? 'updating...' : 'update password'}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default SettingsPage;