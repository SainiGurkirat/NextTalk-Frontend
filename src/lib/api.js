// frontend/lib/api.js
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
    }
    return response.json();
};

export const loginUser = async (email, password) => {
    console.log('API: Sending login request with:', { email, password }); // This log you already have

    const requestBody = JSON.stringify({ email, password });
    console.log('API: Stringified request body:', requestBody); // <--- THIS LOG MUST APPEAR

    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody, // Use the variable here
    });
    return handleResponse(response);
};

export const registerUser = async (username, email, password) => {
    console.log('API: Sending register request with:', { username, email, password }); // Debug log

    const requestBody = JSON.stringify({ username, email, password });
    console.log('API: Stringified register body:', requestBody); // <--- THIS LOG MUST APPEAR FOR REGISTER

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
    const response = await fetch(`<span class="math-inline">\{BACKEND\_URL\}/api/users/search?query\=</span>{encodeURIComponent(query)}`, {
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
        body: JSON.stringify({ participants: participantIds, type, name }),
    });
    return handleResponse(response);
};

export const getMessagesForChat = async (chatId, token) => {
    const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

// TODO: Add sendMessage API call here or integrate with WebSocket for real-time messages
/*
export const sendMessage = async (chatId, content, token) => {
    const response = await fetch(`<span class="math-inline">\{BACKEND\_URL\}/<141\>api/chats/</span>{chatId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
    });
    return handleResponse(response);
};
*/