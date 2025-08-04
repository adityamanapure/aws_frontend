import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Use the working AWS EC2 API endpoint directly
const API_URL = 'http://ec2-51-20-79-41.eu-north-1.compute.amazonaws.com/api';

export const HeroSlideContext = createContext();

export const HeroSlideProvider = ({ children }) => {
  const [slides, setSlides] = useState([]);  // Initialize as an empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch slides from API
  const fetchSlides = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/hero-slides/`);  // Note the trailing slash
      // Ensure we're setting an array
      setSlides(Array.isArray(response.data) ? response.data : 
                response.data.results ? response.data.results : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching hero slides:', err);
      setError('Failed to fetch hero slides');
      setSlides([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Add a new slide
  const addSlide = async (slideData) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      console.log("Adding slide with data:", slideData);
      
      Object.keys(slideData).forEach(key => {
        if (key === 'image' && slideData[key] instanceof File) {
          formData.append('image', slideData[key]);
        } else {
          formData.append(key, slideData[key]);
        }
      });

      // Get auth token from localStorage if you're using token-based auth
      const token = localStorage.getItem('authToken');
      const headers = { 
        'Content-Type': 'multipart/form-data',
      };
      
      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log("API URL:", `${API_URL}/hero-slides/`);
      console.log("Using headers:", headers);

      const response = await axios.post(`${API_URL}/hero-slides/`, formData, {
        headers: headers
      });
      
      setSlides(prev => [...prev, response.data]);
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error adding slide:", err);
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
      }
      return { success: false, error: err.response?.data?.message || 'Failed to add slide' };
    } finally {
      setLoading(false);
    }
  };

  // Update an existing slide
  const updateSlide = async (id, slideData) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      Object.keys(slideData).forEach(key => {
        if (key === 'image' && slideData[key] instanceof File) {
          formData.append('image', slideData[key]);
        } else {
          formData.append(key, slideData[key]);
        }
      });

      const response = await axios.put(`${API_URL}/hero-slides/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSlides(prev => prev.map(slide => 
        slide.id === id ? response.data : slide
      ));
      
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error updating slide:', err);
      return { success: false, error: err.response?.data?.message || 'Failed to update slide' };
    } finally {
      setLoading(false);
    }
  };

  // Delete a slide
  const deleteSlide = async (id) => {
    setLoading(true);
    try {
      console.log(`Attempting to delete slide with ID: ${id}`);
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      // Make sure the URL matches exactly what your backend expects
      const response = await fetch(`${API_URL}/hero-slides/${id}/`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Delete response status:', response.status);
        throw new Error(`Failed to delete slide: ${response.statusText}`);
      }

      // Update local state
      setSlides(slides.filter(slide => slide.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting slide:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Reorder slides
  const reorderSlides = async (newOrder) => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/hero-slides/reorder`, { order: newOrder });
      
      // Update local state based on new order
      const reorderedSlides = [...slides];
      newOrder.forEach((id, index) => {
        const slide = reorderedSlides.find(s => s.id === id);
        if (slide) slide.order = index;
      });
      
      setSlides(reorderedSlides.sort((a, b) => a.order - b.order));
      return { success: true };
    } catch (err) {
      console.error('Error reordering slides:', err);
      return { success: false, error: err.response?.data?.message || 'Failed to reorder slides' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  return (
    <HeroSlideContext.Provider value={{
      slides,
      loading,
      error,
      fetchSlides,
      addSlide,
      updateSlide,
      deleteSlide,
      reorderSlides
    }}>
      {children}
    </HeroSlideContext.Provider>
  );
};

export const useHeroSlides = () => useContext(HeroSlideContext);