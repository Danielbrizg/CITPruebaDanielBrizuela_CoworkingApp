// API utilities for authentication and user management

const API_BASE_URL = '/api'

// Helper function to handle API responses
async function handleResponse(response) {
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong')
  }
  
  return data
}

// Authentication API calls
export const authAPI = {
  // Register new user
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    
    return handleResponse(response)
  },

  // Login user
  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
    
    return handleResponse(response)
  },

  // Get user profile
  async getProfile(userId) {
    const response = await fetch(`${API_BASE_URL}/auth/profile?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    return handleResponse(response)
  },

  // Update user profile
  async updateProfile(userId, updateData) {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, ...updateData }),
    })
    
    return handleResponse(response)
  },

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    })
    
    return handleResponse(response)
  }
}

export default { authAPI }
