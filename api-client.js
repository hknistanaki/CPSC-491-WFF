const API_BASE_URL = 'http://localhost:5000/api';

// get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// set auth token in localStorage
function setAuthToken(token) {
    localStorage.setItem('authToken', token);
}

// remove auth token
function removeAuthToken() {
    localStorage.removeItem('authToken');
}

// api call function
async function apiCall(endpoint, options = {}) {
    const token = getAuthToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// auth api calls
const authAPI = {
    async signup(username, email, password) {
        const data = await apiCall('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
            skipAuth: true
        });
        
        if (data.success && data.token) {
            setAuthToken(data.token);
        }
        
        return data;
    },
    
    async login(username, password) {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            skipAuth: true
        });
        
        if (data.success && data.token) {
            setAuthToken(data.token);
        }
        
        return data;
    },
    
    async getCurrentUser() {
        return await apiCall('/auth/me');
    },
    
    async updateProfile(username, email) {
        return await apiCall('/auth/update', {
            method: 'PUT',
            body: JSON.stringify({ username, email })
        });
    },
    
    async resetPassword(email, newPassword) {
        return await apiCall('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, newPassword }),
            skipAuth: true
        });
    },
    
    logout() {
        removeAuthToken();
        localStorage.removeItem('sessionUser');
        localStorage.removeItem('rememberedUser');
        localStorage.removeItem('rememberMe');
    }
};

// fountain api calls
const fountainAPI = {
    async getAll() {
        return await apiCall('/fountains', {
            skipAuth: true
        });
    },
    
    async getOne(id) {
        return await apiCall(`/fountains/${id}`, {
            skipAuth: true
        });
    },
    
    async create(name, address, lat, lng) {
        return await apiCall('/fountains', {
            method: 'POST',
            body: JSON.stringify({ name, address, lat, lng })
        });
    },
    
    async addReview(fountainId, status, text) {
        return await apiCall(`/fountains/${fountainId}/reviews`, {
            method: 'POST',
            body: JSON.stringify({ status, text })
        });
    },
    
    async report(fountainId) {
        return await apiCall(`/fountains/${fountainId}/report`, {
            method: 'POST'
        });
    },
    
    async delete(fountainId) {
        return await apiCall(`/fountains/${fountainId}`, {
            method: 'DELETE'
        });
    }
};

// health check
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    } catch (error) {
        console.error('API health check failed:', error);
        return false;
    }
}

