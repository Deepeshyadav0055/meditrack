import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('supabase_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// API methods
export const hospitalAPI = {
    getAll: (params) => api.get('/api/hospitals', { params }),
    getById: (id) => api.get(`/api/hospitals/${id}`)
};

export const bedAPI = {
    getAll: (params) => api.get('/api/beds', { params }),
    update: (id, data) => api.patch(`/api/beds/${id}`, data)
};

export const bloodAPI = {
    getAll: (params) => api.get('/api/blood', { params }),
    update: (id, data) => api.patch(`/api/blood/${id}`, data)
};

export const ambulanceAPI = {
    findNearest: (data) => api.post('/api/ambulance/nearest', data)
};

export const alertAPI = {
    getAll: (params) => api.get('/api/alerts', { params }),
    resolve: (id) => api.post(`/api/alerts/${id}/resolve`)
};

export const aiAPI = {
    getRecommendation: (data) => api.post('/api/ai/recommend', data)
};

export default api;
