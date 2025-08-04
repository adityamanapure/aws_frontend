import axios from 'axios';

// Use the working AWS EC2 API endpoint directly
const API_URL = 'http://ec2-51-20-79-41.eu-north-1.compute.amazonaws.com/api';

/**
 * Fetch categories from the API
 */
export const getCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/categories/`);
    
    // Make sure we're returning an array
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data.results && Array.isArray(response.data.results)) {
      // If data is in paginated format
      return response.data.results;
    } else if (typeof response.data === 'object') {
      // If data is an object, try to find categories array in it
      const possibleArrayFields = ['categories', 'data', 'items', 'results'];
      for (const field of possibleArrayFields) {
        if (Array.isArray(response.data[field])) {
          return response.data[field];
        }
      }
      // If no array found, convert object to array (if it's an object of objects)
      if (Object.keys(response.data).length > 0) {
        return Object.values(response.data);
      }
    }
    
    // Fallback - return empty array if no valid data found
    console.error('Categories data is not in expected format:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return []; // Return empty array on error to avoid breaking the UI
  }
};

/**
 * Fetch products with pagination and optional category filtering
 * @param {number} page - Page number for pagination
 * @param {string|null} categoryId - Optional category ID to filter products
 * @param {number} limit - Number of products per page
 */
export const getProducts = async (page = 1, categoryId = null, limit = 12) => {
  try {
    // Build the URL with query parameters
    let url = `${API_URL}/products/?page=${page}&page_size=${limit}`;
    
    // Add category filter if provided
    if (categoryId) {
      url += `&categories=${categoryId}`;
    }
    
    const response = await axios.get(url);
    
    // Check if the response has paginated results structure
    if (response.data.results) {
      return response.data.results;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Fetch a single product by ID
 * @param {string} productId - UUID of the product to fetch
 */
export const getProductById = async (productId) => {
  try {
    const response = await axios.get(`${API_URL}/products/${productId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    throw error;
  }
};

/**
 * Fetch featured products
 */
export const getFeaturedProducts = async (limit = 6) => {
  try {
    const response = await axios.get(`${API_URL}/products/?featured=true&page_size=${limit}`);
    
    if (response.data.results) {
      return response.data.results;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    throw error;
  }
};

/**
 * Search products by query
 * @param {string} query - Search term
 */
export const searchProducts = async (query) => {
  try {
    const response = await axios.get(`${API_URL}/products/?search=${encodeURIComponent(query)}`);
    
    if (response.data.results) {
      return response.data.results;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

/**
 * Fetch products by category
 * @param {string} categoryId - Category ID to filter products
 * @param {number} limit - Number of products to fetch
 * @param {string|null} excludeProductId - Product ID to exclude from results
 */
export const getProductsByCategory = async (categoryId, limit = 4, excludeProductId = null) => {
  try {
    let url = `${API_URL}/products/?category=${categoryId}&limit=${limit}`;
    
    if (excludeProductId) {
      url += `&exclude=${excludeProductId}`;
    }
    
    const response = await axios.get(url);
    return response.data.results || response.data;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
};

// Get bestseller products from the backend
export const getBestsellers = async () => {
  try {
    const response = await axios.get(`${API_URL}/products/bestsellers/`);
    return response.data.results || response.data;
  } catch (error) {
    console.error('Error fetching bestsellers:', error);
    return null;
  }
};