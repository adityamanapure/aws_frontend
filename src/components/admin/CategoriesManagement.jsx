import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../styles/admin/CategoriesManagement.css';

import api from '../../services/api';
import { Search, Plus, Edit, X, Camera, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Form state - Updated for backend-to-S3 uploads
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '', // Store backend-to-S3 image URL
    parent_id: '',
    status: 'active',
    display_order: '0'
  });

  // Preview state for images
  const [imagePreviews, setImagePreviews] = useState([]);

  // Upload progress tracking for backend-to-S3
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    image: {}
  });

  // Memoize the fetchCategories function with useCallback
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await api.get('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
        params: { sort_field: sortField, sort_direction: sortDirection }
      });
      
      console.log('Categories data:', response.data);
      setCategories(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Error fetching categories. Please try again.');
      setLoading(false);
    }
  }, [sortField, sortDirection]);
  
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      parent_id: '',
      status: 'active',
      display_order: '0'
    });
    setImagePreviews([]);
    setUploadProgress({ image: {} });
  };

  const handleAddCategory = () => {
    setIsEditing(false);
    resetForm();
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setIsEditing(true);
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image_url: category.image || '',
      parent_id: category.parent_id?.toString() || '',
      status: category.status || 'active',
      display_order: category.display_order?.toString() || '0'
    });

    // Set previews for existing image
    if (category.image) {
      setImagePreviews([{
        id: 'existing_image',
        url: category.image,
        uploading: false,
        backendToS3Upload: true,
        existing: true
      }]);
    } else {
      setImagePreviews([]);
    }

    setShowCategoryModal(true);
  };

  // Enhanced delete category function with better error handling
  const deleteCategory = async (categoryId) => {
    try {
      setIsDeleting(true);
      setSelectedCategoryId(categoryId);
      setDeleteError(null);
      
      // Clear any previous success message
      setSuccessMessage(null);
      
      const token = localStorage.getItem('adminToken');
      
      // First, check if the category has any products
      const checkResponse = await api.get(`/api/admin/categories/${categoryId}/products-count`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(error => {
        // If this endpoint doesn't exist, we'll proceed with deletion
        console.log("Products count check not available, proceeding with deletion attempt");
        return { data: { count: null } };
      });
      
      // If we know there are associated products, warn the user
      const productsCount = checkResponse.data?.count;
      if (productsCount && productsCount > 0) {
        if (!window.confirm(
          `This category has ${productsCount} product(s) associated with it. ` +
          `Deleting it may affect these products. Do you want to proceed?`
        )) {
          setIsDeleting(false);
          setSelectedCategoryId(null);
          return;
        }
      } else {
        // Regular confirmation
        if (!window.confirm('Are you sure you want to delete this category?')) {
          setIsDeleting(false);
          setSelectedCategoryId(null);
          return;
        }
      }
      
      // Proceed with deletion
      await api.delete(`/api/admin/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update UI
      setCategories(categories.filter(category => category.id !== categoryId));
      setSuccessMessage('Category deleted successfully');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error deleting category:', error);
      
      // Parse and display the specific error message from backend
      let errorMessage = 'Failed to delete category.';
      
      if (error.response) {
        console.log('Response error data:', error.response.data);
        
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
        
        // Special handling for common errors
        if (error.response.status === 400) {
          // Handle specific 400 error messages
          if (errorMessage.includes('products') || errorMessage.includes('using this category')) {
            errorMessage = `Cannot delete this category because it has products assigned to it. 
                           Please reassign these products to a different category first.`;
          }
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to delete this category.';
        }
      }
      
      setDeleteError(errorMessage);
      
    } finally {
      setIsDeleting(false);
      setSelectedCategoryId(null);
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setDeleteError(null);
      }, 5000);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
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
          uploadFormData.append('content_type', 'category');
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

  // Updated handleSubmit to use backend-to-S3 URLs instead of files
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');
      
      // Create data for API request
      const categoryData = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        display_order: formData.display_order,
        image: formData.image_url // Use the backend-to-S3 uploaded URL
      };
      
      // Add parent category if selected
      if (formData.parent_id) {
        categoryData.parent_id = formData.parent_id;
      }

      console.log('Saving category with backend-to-S3 uploaded image:', categoryData);

      // Create new category or update existing one
      let response;
      if (isEditing) {
        response = await api.put(`/api/admin/categories/${selectedCategory.id}`, categoryData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        response = await api.post('/api/admin/categories', categoryData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      // Reset form and refresh categories
      resetForm();
      setShowCategoryModal(false);
      setSelectedCategory(null);
      setIsEditing(false);
      
      // Set success message
      setSuccessMessage(isEditing ? 'Category updated successfully' : 'Category created successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Refresh the categories list
      fetchCategories();

    } catch (err) {
      console.error('Error saving category:', err);
      setError('Failed to save category. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Helper function to build category hierarchy for dropdown
  const buildCategoryOptions = (categoriesList, parentId = null, level = 0) => {
    const options = [];
    const filteredCategories = categoriesList.filter(cat => 
      (parentId === null && !cat.parent_id) || 
      (cat.parent_id === parentId)
    );

    filteredCategories.forEach(category => {
      // Don't include the current category being edited as a parent option
      if (isEditing && selectedCategory && category.id === selectedCategory.id) {
        return;
      }
      
      const indent = '—'.repeat(level);
      options.push(
        <option key={category.id} value={category.id}>
          {indent} {category.name}
        </option>
      );
      
      // Recursively add child categories
      const childOptions = buildCategoryOptions(categoriesList, category.id, level + 1);
      options.push(...childOptions);
    });

    return options;
  };

  const renderCategoryImage = (category) => {
    return (
      <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
        <img 
          src={getImageUrl(category.image)}
          alt={category.name}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      </div>
    );
  };

  return (
    <div className="admin-categories-container">
      <div className="admin-categories-header">
        <h2 className="admin-categories-title">Manage Categories (Backend-to-S3 Upload)</h2>
        
        <div className="admin-categories-controls">
          <div className="admin-search-container">
            <input
              type="text"
              placeholder="Search categories..."
              className="admin-search-input"
              value={searchQuery}
              onChange={handleSearch}
            />
            <Search className="admin-search-icon" size={18} />
          </div>
          
          <button
            onClick={handleAddCategory}
            className="admin-add-button"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="admin-loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : error ? (
        <div className="admin-error-message">{error}</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="image-column">Image</th>
                <th 
                  className="sortable-column"
                  onClick={() => handleSort('name')}
                >
                  <div className="sort-header">
                    Category Name
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th className="description-column">Description</th>
                <th 
                  className="sortable-column"
                  onClick={() => handleSort('status')}
                >
                  <div className="sort-header">
                    Status
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th 
                  className="sortable-column"
                  onClick={() => handleSort('display_order')}
                >
                  <div className="sort-header">
                    Order
                    {sortField === 'display_order' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-table-message">
                    No categories found
                  </td>
                </tr>
              ) : (
                filteredCategories.map(category => (
                  <tr key={category.id} className="table-row">
                    <td className="image-cell">
                      <div className="category-image-container">
                        {category.image ? (
                          renderCategoryImage(category)
                        ) : (
                          <div className="image-placeholder">
                            <Camera size={20} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="name-cell">
                      <div className="category-name">{category.name}</div>
                      {category.parent_name && (
                        <div className="parent-category">Parent: {category.parent_name}</div>
                      )}
                    </td>
                    <td className="description-cell">
                      <div className="category-description">{category.description || "—"}</div>
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${category.status === 'active' ? 'active' : 'inactive'}`}>
                        {category.status || 'Active'}
                      </span>
                    </td>
                    <td className="order-cell">
                      {category.display_order || 0}
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleEditCategory(category)}
                          className="edit-button"
                          title="Edit Category"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => deleteCategory(category.id)}
                          className={`text-red-600 hover:text-red-800 transition-colors ${
                            isDeleting && selectedCategoryId === category.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={isDeleting && selectedCategoryId === category.id}
                          title="Delete Category"
                        >
                          {isDeleting && selectedCategoryId === category.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-title">
                {isEditing ? 'Edit Category (Backend-to-S3)' : 'Add New Category (Backend-to-S3)'}
              </div>
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="modal-close-button"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="e.g. Necklaces"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    Parent Category
                  </label>
                  <select
                    name="parent_id"
                    value={formData.parent_id}
                    onChange={handleFormChange}
                    className="form-select"
                  >
                    <option value="">No Parent (Top Level)</option>
                    {buildCategoryOptions(categories)}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="form-select"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="e.g. 1"
                    min="0"
                  />
                  <div className="help-text">Lower numbers appear first</div>
                </div>
              </div>
              
              <div className="form-group full-width">
                <label className="form-label">
                  Category Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="form-textarea"
                  placeholder="Brief description of the category..."
                />
              </div>
              
              <div className="form-group full-width">
                <label className="form-label">
                  Category Image (Backend-to-S3 Upload)
                </label>
                
                <div className="media-upload-section">
                  {imagePreviews.map((preview, index) => (
                    <div key={preview.id} className="relative w-24 h-24 border rounded overflow-hidden mb-4">
                      <img 
                        src={preview.url} 
                        alt="Category preview"
                        className="w-full h-full object-cover"
                      />
                      {preview.uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-1"></div>
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
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  
                  {imagePreviews.length === 0 && (
                    <div className="image-upload-placeholder">
                      <div className="upload-icon-container">
                        <Camera size={24} />
                        <span>Upload Image</span>
                      </div>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="file-input"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </div>
                  )}
                </div>
                <div className="help-text">
                  Upload image to backend server then push to S3. Max 100MB per image.
                </div>
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || uploadingImage}
                  className="save-button"
                >
                  {formSubmitting ? (
                    <>
                      <div className="button-spinner"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="button-icon" />
                      {isEditing ? 'Update Category' : 'Save Category'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Display success message if any */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Success: </strong>
          <span className="block sm:inline">{successMessage}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg 
              onClick={() => setSuccessMessage(null)}
              className="fill-current h-6 w-6 text-green-500" 
              role="button" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20"
            >
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>
      )}
      
      {/* Display delete error if any */}
      {deleteError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{deleteError}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg 
              onClick={() => setDeleteError(null)}
              className="fill-current h-6 w-6 text-red-500" 
              role="button" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20"
            >
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>
      )}
    </div>
  );
};

export default CategoriesManagement;