const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }
  return response.json();
};

export const registerUser = async (credentials) => {
  const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};

export const loginUser = async (credentials) => {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};

export const getUserProfile = async (token) => {
  const response = await fetch(`${BACKEND_URL}/api/users/me`, {
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

export const getChats = async (token) => {
  const response = await fetch(`${BACKEND_URL}/api/chats`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleResponse(response);
};

export const getChatMessages = async (chatId, token) => {
  const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}/messages`, {
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