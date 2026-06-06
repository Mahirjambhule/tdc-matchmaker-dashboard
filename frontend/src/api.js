const API_BASE_URL = 'http://localhost:5000/api';

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

  getAlgorithmicMatches: async (id) => {
    const response = await fetch(`${API_BASE_URL}/customers/${id}/matches`);
    if (!response.ok) throw new Error('Failed executing backend matrix filtering calculations');
    return response.json();
  },

  getAIMatchAnalysis: async (clientId, matchId) => {
    const response = await fetch(`${API_BASE_URL}/customers/ai-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, matchId })
    });
    if (!response.ok) throw new Error('Gemini profiling query crashed');
    return response.json();
  }
};