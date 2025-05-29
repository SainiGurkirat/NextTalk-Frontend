// frontend/lib/api.js
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
// Changed API_BASE_URL to BACKEND_URL for consistency as used in the file

const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
    }
    return response.json();
};

export const registerUser = async (username, email, password) => {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
    });
    return handleResponse(response);
};

export const loginUser = async (email, password) => {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
};

export const getUserProfile = async (token) => {
    // --- UPDATED: Corrected endpoint from /api/auth/me to /api/users/me ---
    const response = await fetch(`${BACKEND_URL}/api/users/me`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

export const getChats = async (token) => {
    const response = await fetch(`${BACKEND_URL}/api/chats`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

export const createChat = async (participantIds, type, name = '', token) => {
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

export const sendMessage = async (chatId, content, token, file = null) => {
    let body;
    let headers = {
        'Authorization': `Bearer ${token}`,
    };

    if (file) {
        const formData = new FormData();
        if (content.trim()) {
            formData.append('content', content.trim());
        }
        formData.append('media', file);

        body = formData;
    } else {
        body = JSON.stringify({ content });
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: headers,
        body: body,
    });
    return handleResponse(response);
};

export const getMessagesForChat = async (chatId, token) => {
    const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}/messages`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

export const searchUsers = async (query, token) => {
    const response = await fetch(`${BACKEND_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

export const markMessagesAsRead = async (chatId, token) => {
    const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}/markAsRead`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
    });
    return handleResponse(response);
};

// NEW: Get Group Members
export const getGroupMembers = async (chatId, token) => {
    const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}/members`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

// NEW: Add Group Members
export const addGroupMembers = async (chatId, newMemberIds, token) => {
    const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}/members`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ new_member_ids: newMemberIds }),
    });
    return handleResponse(response);
};

// NEW: Remove Group Member
export const removeGroupMember = async (chatId, memberIdToRemove, token) => {
    const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}/members/${memberIdToRemove}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

// NEW: Hide a private chat
export const hideChat = async (chatId, token) => {
    const response = await fetch(`${BACKEND_URL}/api/chats/hide/${chatId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return handleResponse(response);
};

// NEW: Leave a group chat
export const leaveGroupChat = async (chatId, token) => {
    const response = await fetch(`${BACKEND_URL}/api/chats/leave/${chatId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return handleResponse(response);
};

export const updateUserProfilePicture = async (formData, token) => {
    // --- UPDATED: Added /api/ prefix ---
    const response = await fetch(`${BACKEND_URL}/api/users/profile-picture`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });
    return handleResponse(response);
};

export const updateUsername = async (newUsername, token) => {
    // --- UPDATED: Added /api/ prefix ---
    const response = await fetch(`${BACKEND_URL}/api/users/username`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username: newUsername }),
    });
    return handleResponse(response);
};

export const updateEmail = async (newEmail, token) => {
    // --- UPDATED: Added /api/ prefix ---
    const response = await fetch(`${BACKEND_URL}/api/users/email`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail }),
    });
    return handleResponse(response);
};

export const updatePassword = async (currentPassword, newPassword, token) => {
    // --- UPDATED: Added /api/ prefix ---
    const response = await fetch(`${BACKEND_URL}/api/users/password`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(response);
};

// --- Availability Check APIs ---

export const checkUsernameAvailability = async (username) => {
    // --- UPDATED: Added /api/ prefix ---
    const response = await fetch(`${BACKEND_URL}/api/users/check-username?username=${encodeURIComponent(username)}`);
    const data = await response.json();
    return data.isAvailable;
};

export const checkEmailAvailability = async (email) => {
    // --- UPDATED: Added /api/ prefix ---
    const response = await fetch(`${BACKEND_URL}/api/users/check-email?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    return data.isAvailable;
};