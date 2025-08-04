import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Eye, EyeOff, Camera } from 'lucide-react';
import api from '../../services/api';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';

const HeroSlidesManagement = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Initial form state - Updated for backend-to-S3 uploads
  const initialFormState = {
    title: '',
    subtitle: '',
    buttonText: '',
    buttonLink: '',
    active: true,
    image_url: '', // Store backend-to-S3 image URL
    imagePreview: null
  };
  
  // Form state
  const [formData, setFormData] = useState(initialFormState);
  
  // Upload progress tracking for backend-to-S3
  const [uploadProgress, setUploadProgress] = useState({
    image: {}
  });

  // Preview state for images
  const [imagePreviews, setImagePreviews] = useState([]);
  
  useEffect(() => {
    fetchSlides();
  }, []);
  
  const fetchSlides = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await api.get('/api/hero-slides/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSlides(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching hero slides:', err);
      setError('Failed to load hero slides. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddSlide = () => {
    setEditingSlide(null);
    setFormData(initialFormState);
    setImagePreviews([]);
    setIsFormOpen(true);
  };
  
  const handleEditSlide = (slide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      buttonText: slide.button_text || '',
      buttonLink: slide.button_link || '',
      active: slide.active,
      image_url: slide.image_url || '',
      imagePreview: null
    });
    
    // Set previews for existing image
    if (slide.image_url) {
      setImagePreviews([{
        id: 'existing_image',
        url: slide.image_url,
        uploading: false,
        backendToS3Upload: true,
        existing: true
      }]);
    } else {
      setImagePreviews([]);
    }
    
    setIsFormOpen(true);
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Enhanced handleImageUpload using backend-to-S3 approach
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    console.log(`Selected ${files.length} new images for backend-to-S3 upload`);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB limit
      
      if (!isValidType) {
        console.warn(`Invalid file type for ${file.name}:`, file.type);
      }
      if (!isValidSize) {
        console.warn(`File too large for ${file.name}:`, file.size);
      }
      
      return isValidType && isValidSize;
    });
    
    if (validFiles.length < files.length) {
      alert(`Some files were skipped. Only image files under 100MB are allowed.`);
    }

    if (validFiles.length === 0) return;

    try {
      setUploadingImage(true);
      
      for (const [index, file] of validFiles.entries()) {
        const progressKey = `image_${Date.now()}_${index}`;
        
        // Add preview immediately
        const preview = {
          id: progressKey,
          url: URL.createObjectURL(file),
          uploading: true,
          progress: 0,
          backendToS3Upload: true
        };
        
        setImagePreviews(prev => [...prev, preview]);
        
        try {
          // Create FormData for backend upload
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          uploadFormData.append('content_type', 'hero_slide');
          uploadFormData.append('file_type', 'image');
          
          console.log(`Uploading ${file.name} to backend for S3 processing...`);
          
          // Upload via backend-to-S3 endpoint with progress tracking
          const response = await api.post('/api/admin/upload/backend-to-s3/', uploadFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.lengthComputable) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                
                // Update progress in previews
                setImagePreviews(prev => prev.map(p => 
                  p.id === progressKey ? { ...p, progress } : p
                ));
                
                // Update progress tracking
                setUploadProgress(prev => ({
                  ...prev,
                  image: { ...prev.image, [progressKey]: progress }
                }));
              }
            }
          });
          
          if (response.data && response.data.success) {
            console.log('Backend-to-S3 image upload successful:', response.data);
            
            // Update preview with successful upload
            setImagePreviews(prev => prev.map(p => 
              p.id === progressKey ? {
                ...p,
                uploading: false,
                progress: 100,
                cloudfront_url: response.data.cloudfront_url,
                s3_url: response.data.s3_url,
                s3_key: response.data.s3_key
              } : p
            ));
            
            // Update form data with CloudFront URL
            setFormData(prev => ({
              ...prev,
              image_url: response.data.cloudfront_url || response.data.s3_url
            }));
            
          } else {
            throw new Error(response.data?.message || 'Upload failed');
          }
          
        } catch (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          
          // Update preview with error state
          setImagePreviews(prev => prev.map(p => 
            p.id === progressKey ? {
              ...p,
              uploading: false,
              error: uploadError.response?.data?.error || uploadError.message || 'Upload failed'
            } : p
          ));
          
          alert(`Failed to upload ${file.name}: ${uploadError.response?.data?.error || uploadError.message}`);
        }
      }
      
    } catch (error) {
      console.error('Error in image upload process:', error);
      alert('Failed to start upload process. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Updated handleSubmit to use backend-to-S3 URLs
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      // Create data for API request
      const slideData = {
        title: formData.title,
        subtitle: formData.subtitle,
        button_text: formData.buttonText,
        button_link: formData.buttonLink,
        active: formData.active,
        image_url: formData.image_url
      };
      
      console.log('Saving hero slide with backend-to-S3 uploaded image:', slideData);
      
      if (editingSlide) {
        await updateSlide(editingSlide.id, slideData, token);
      } else {
        await createSlide(slideData, token);
      }
      
      setFormData(initialFormState);
      setImagePreviews([]);
      setIsFormOpen(false);
      setEditingSlide(null);
      fetchSlides();
      
    } catch (err) {
      console.error('Error saving slide:', err);
      setError('Failed to save slide. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Helper functions for API calls
  const createSlide = async (slideData, token) => {
    await api.post('/api/hero-slides/', slideData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  };
  
  const updateSlide = async (id, slideData, token) => {
    await api.put(`/api/hero-slides/${id}/`, slideData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  };
  
  const toggleSlideStatus = async (slide) => {
    try {
      const token = localStorage.getItem('adminToken');
      await api.patch(`/api/hero-slides/${slide.id}/`, 
        { active: !slide.active }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update slide in state
      setSlides(slides.map(s => s.id === slide.id ? {...s, active: !s.active} : s));
    } catch (err) {
      console.error('Error toggling slide status:', err);
      setError('Failed to update slide status');
    }
  };
  
  const deleteSlide = async (slideId) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await api.delete(`/api/hero-slides/${slideId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove slide from state
      setSlides(slides.filter(s => s.id !== slideId));
    } catch (err) {
      console.error('Error deleting slide:', err);
      setError('Failed to delete slide. Please try again.');
    }
  };

  const removeImage = (index) => {
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      const removed = newPreviews.splice(index, 1)[0];
      if (removed && removed.url && !removed.existing) {
        URL.revokeObjectURL(removed.url);
      }
      return newPreviews;
    });
    
    // Clear form data if no images left
    if (imagePreviews.length <= 1) {
      setFormData(prev => ({ ...prev, image_url: '' }));
    }
  };
  
  return (
    <div className="hero-slides-management p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Hero Slides Management (Backend-to-S3 Upload)</h2>
        <button
          onClick={handleAddSlide}
          className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          <Plus size={18} className="mr-1" /> Add New Slide
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center my-8">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : slides.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded">
          <p className="text-gray-500">No hero slides found. Create your first slide!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title / Subtitle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Button
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {slides.map((slide) => (
                <tr key={slide.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-20 h-14 bg-gray-200 rounded overflow-hidden">
                      {slide.image_url ? (
                        <img 
                          src={getImageUrl(slide.image_url)}
                          alt={slide.title || 'Hero slide'}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="text-gray-400" size={24} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{slide.title}</div>
                    <div className="text-sm text-gray-500">{slide.subtitle}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {slide.button_text && (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                        {slide.button_text}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      onClick={() => toggleSlideStatus(slide)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${
                        slide.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {slide.active ? (
                        <>
                          <Eye size={14} className="mr-1" /> Active
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} className="mr-1" /> Hidden
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <div className="flex justify-center space-x-2">
                      <button 
                        onClick={() => handleEditSlide(slide)}
                        className="p-1 rounded-full hover:bg-yellow-50 text-yellow-600"
                        title="Edit Slide"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => deleteSlide(slide.id)}
                        className="p-1 rounded-full hover:bg-red-50 text-red-600"
                        title="Delete Slide"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium">
                {editingSlide ? 'Edit Hero Slide (Backend-to-S3)' : 'Add New Hero Slide (Backend-to-S3)'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      name="buttonText"
                      value={formData.buttonText}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="e.g. Shop Now"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Link</label>
                    <input
                      type="text"
                      name="buttonLink"
                      value={formData.buttonLink}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="e.g. /products/category/1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Active (visible on the homepage)
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hero Image (Backend-to-S3 Upload)
                  </label>
                  
                  <div className="media-upload-section">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview.id} className="relative w-full h-40 border rounded overflow-hidden mb-4">
                        <img 
                          src={preview.url} 
                          alt="Hero slide preview"
                          className="w-full h-full object-cover"
                        />
                        {preview.uploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-1"></div>
                            <span className="text-white text-xs">{preview.progress || 0}%</span>
                          </div>
                        )}
                        {preview.backendToS3Upload && (
                          <div className="absolute bottom-0 left-0 bg-green-600 text-white text-xs px-1">Backend→S3</div>
                        )}
                        {preview.error && (
                          <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                            <span className="text-white text-xs text-center">Error</span>
                          </div>
                        )}
                        <button 
                          type="button"
                          onClick={() => removeImage(index)} 
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                          title="Remove image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    
                    {imagePreviews.length === 0 && (
                      <div className="file-upload-container">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-yellow-50 file:text-yellow-700
                            hover:file:bg-yellow-100"
                        />
                      </div>
                    )}
                  </div>
                  <small className="text-gray-500">
                    Upload image to backend server then push to S3. Max 100MB per image.
                  </small>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Slide'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroSlidesManagement;