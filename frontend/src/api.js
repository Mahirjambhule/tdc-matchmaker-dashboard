import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'  // 👈 Point to your local port (5000 or whatever your backend server.js runs on)
  : 'https://tdc-matchmaker-api-zteg.onrender.com/api';

export const api = {
  getCustomers: async () => {
    const response = await fetch(`${API_BASE_URL}/customers`);
    if (!response.ok) throw new Error('Failed to fetch customer directory');
    return response.json();
  },

  getCustomerById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`);
    if (!response.ok) throw new Error('Failed to load student/client profile data');
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

  // Make sure it is hitting your dynamic route parameter precisely:
getAlgorithmicMatches: async (id) => {
  const response = await axios.get(`${API_BASE_URL}/customers/${id}/matches`); // Or whatever your route string is named
  return response.data;
},

  // Inside your frontend src/api.js file
  getAIMatchAnalysis: async ({ clientId, matchId }) => {
    // Pass the data object payload straight to your updated Express endpoint
    const response = await axios.post(`${API_BASE_URL}/customers/ai/analyze`, { clientId, matchId });
    return response.data;
  }
};