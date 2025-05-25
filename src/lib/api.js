// frontend/lib/api.js
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const handleResponse = async (response) => {
    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || 'Something went wrong');
        } catch (e) {
            throw new Error(response.statusText || 'Something went wrong on the server');
        }
    }
    return response.json();
};

export const loginUser = async (email, password) => {
    console.log('API: Sending login request with:', { email, password });
    const requestBody = JSON.stringify({ email, password });
    console.log('API: Stringified request body:', requestBody);
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
    });
    return handleResponse(response);
};

export const registerUser = async (username, email, password) => {
    console.log('API: Sending register request with:', { username, email, password });
    const requestBody = JSON.stringify({ username, email, password });
    console.log('API: Stringified register body:', requestBody);
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
    });
    return handleResponse(response);
};

export const getUserProfile = async (token) => {
    const response = await fetch(`${BACKEND_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

export const getChats = async (token) => {
    const response = await fetch(`${BACKEND_URL}/api/chats`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

export const searchUsers = async (query, token) => {
    const response = await fetch(`${BACKEND_URL}/api/users/search?query=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

export const createChat = async (participantIds, type, name, token) => {
    const response = await fetch(`${BACKEND_URL}/api/chats`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ participantIds, type, name }),
    });
    return handleResponse(response);
};

export const getMessagesForChat = async (chatId, token) => {
    const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

export const sendMessage = async (chatId, content, token) => {
    const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
    });
    return handleResponse(response);
};

// NEW API CALL: Mark messages in a chat as read
export const markMessagesAsRead = async (chatId, token) => {
    const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}/markAsRead`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}), // Empty body for a POST request that doesn't need data
    });
    return handleResponse(response);
};