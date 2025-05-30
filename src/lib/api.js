// frontend/lib/api.js
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
// sets the base url for backend api calls

// handles api response errors
const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'something went wrong');
    }
    return response.json();
};

// registers a new user
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

// logs in a user
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

// fetches the current user's profile
export const getUserProfile = async (token) => {
    const response = await fetch(`${BACKEND_URL}/api/users/me`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

// retrieves all chats for the user
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

// creates a new chat, either private or group
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

// sends a message within a chat, supporting text and files
export const sendMessage = async (chatId, content, token, file = null) => {
    let body;
    let headers = {
        'Authorization': `Bearer ${token}`,
    };

    // prepares body based on whether a file is included
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

// retrieves messages for a specific chat
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

// searches for users by username or email
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

// marks messages in a chat as read
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

// fetches members of a group chat
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

// adds new members to an existing group chat
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

// removes a member from a group chat
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

// hides a private chat from the chat list
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

// allows a user to leave a group chat
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

// updates the user's profile picture
export const updateUserProfilePicture = async (formData, token) => {
    const response = await fetch(`${BACKEND_URL}/api/users/profile-picture`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });
    return handleResponse(response);
};

// updates the user's username
export const updateUsername = async (newUsername, token) => {
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

// updates the user's email address
export const updateEmail = async (newEmail, token) => {
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

// updates the user's password
export const updatePassword = async (currentPassword, newPassword, token) => {
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

// checks if a username is available
export const checkUsernameAvailability = async (username) => {
    const response = await fetch(`${BACKEND_URL}/api/users/check-username?username=${encodeURIComponent(username)}`);
    const data = await response.json();
    return data.isAvailable;
};

// checks if an email is available
export const checkEmailAvailability = async (email) => {
    const response = await fetch(`${BACKEND_URL}/api/users/check-email?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    return data.isAvailable;
};