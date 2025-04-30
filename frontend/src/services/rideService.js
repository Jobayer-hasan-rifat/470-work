import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Add auth token to all requests
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const rideService = {
  // Create a new ride offer
  createRideOffer: async (rideData) => {
    try {
      const response = await axios.post(`${API_URL}/rides/offers`, rideData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create a new ride request
  createRideRequest: async (rideData) => {
    try {
      const response = await axios.post(`${API_URL}/rides/requests`, rideData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get a specific ride by ID
  getRide: async (rideId) => {
    try {
      const response = await axios.get(`${API_URL}/rides/${rideId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all rides with optional filters
  getRides: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/rides`, { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Contact ride creator
  contactRideCreator: async (rideId) => {
    try {
      const response = await axios.get(`${API_URL}/rides/${rideId}/contact`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default rideService;
