import axios from 'axios';
import { API_URL } from '../config/api';

const contactService = {
  submitContactForm: async (formData) => {
    try {
      const response = await axios.post(`${API_URL}/contact`, formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Contact service error:', error);
      throw error.response?.data || { 
        success: false, 
        message: 'Network error. Please try again.' 
      };
    }
  }
};

export default contactService;
