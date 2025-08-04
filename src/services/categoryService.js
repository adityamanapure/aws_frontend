import axios from 'axios';

// Use the working AWS EC2 API endpoint directly
const API_URL = 'http://ec2-51-20-79-41.eu-north-1.compute.amazonaws.com/api';

/**
 * Fetch all categories
 */
export const getCategories = async () => {
  try {
    // Add explicit logging to see what's happening
    console.log('Fetching categories from:', `${API_URL}/categories/`);
    const response = await axios.get(`${API_URL}/categories/`);
    console.log('Raw categories API response:', response);
    
    if (response.data) {
      console.log('Categories data received:', response.data);
      return response.data;
    } else {
      console.error('Empty response data from categories API');
      return [];
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Fetch a single category by ID
 * @param {string} id - Category ID
 */
export const getCategoryById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/categories/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching category with id ${id}:`, error);
    throw error;
  }
};