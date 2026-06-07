import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'  
  : 'https://tdc-matchmaker-api-zteg.onrender.com/api';

export const api = {
  getCustomers: async () => {
    const response = await fetch(`${API_BASE_URL}/customers`);
    if (!response.ok) throw new Error('Failed to fetch customer directory');
    return response.json();
  },

  getCustomerById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`);
    if (!response.ok) throw new Error('Failed to load profile data');
    return response.json();
  },

  updateCustomerLogs: async (id, journeyStatus, newNote) => {
    const response = await fetch(`${API_BASE_URL}/customers/${id}/logs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ journeyStatus, newNote })
    });
    if (!response.ok) throw new Error('Failed to post updated notes to registry');
    return response.json();
  },

  deleteCustomerLog: async (id, noteId) => {
    const response = await fetch(`${API_BASE_URL}/customers/${id}/logs/${noteId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to remove targeted note item');
    return response.json();
  },

  getAlgorithmicMatches: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/customers/${id}/matches`); 
    return response.data;
  },

  getAIMatchAnalysis: async ({ clientId, matchId }) => {
    const response = await axios.post(`${API_BASE_URL}/customers/ai/analyze`, { clientId, matchId });
    return response.data;
  }
};