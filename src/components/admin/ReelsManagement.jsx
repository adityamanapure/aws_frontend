import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Edit, 
  X, 
  Camera, 
  Save, 
  Play, 
  Pause, 
  Video, 
  Link, 
  Trash, 
  CheckSquare 
} from 'lucide-react';
import api from '../../services/api';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';
import '../../styles/admin/adminReels.css';

const ReelsManagement = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinkProductsModal, setShowLinkProductsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingReelId, setEditingReelId] = useState(null);
  
  // Updated form data structure for backend-to-S3 uploads
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',        // Store backend-to-S3 video URL
    thumbnail_url: '',    // Store backend-to-S3 thumbnail URL
    featured: false
  });

  // Upload progress tracking for backend-to-S3
  const [uploadProgress, setUploadProgress] = useState({
    video: {},
    thumbnail: {}
  });

  // Preview state for media
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [thumbnailPreviews, setThumbnailPreviews] = useState([]);
  
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchReels();
    fetchAllProducts();
  }, []);
  
  const fetchReels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await api.get('/api/reels/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle paginated response
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setReels(response.data.results);
      } else if (Array.isArray(response.data)) {
        setReels(response.data);
      } else {
        console.error('Unexpected data format:', response.data);
        setError('Invalid data format received from server');
        setReels([]);
      }
    } catch (err) {
      console.error('Error fetching reels:', err);
      setError('Failed to fetch reels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await api.get('/api/products/');
      
      // Handle paginated response
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setAllProducts(response.data.results);
      } else if (Array.isArray(response.data)) {
        setAllProducts(response.data);
      } else {
        console.error('Unexpected products data format:', response.data);
        setAllProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  // Enhanced handleVideoUpload using backend-to-S3 approach (similar to ProductManagement)
  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    console.log(`Selected ${files.length} new videos for backend-to-S3 upload`);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('video/');
      const isValidSize = file.size <= 500 * 1024 * 1024; // 500MB limit
      
      if (!isValidType) {
        console.warn(`Invalid file type for ${file.name}:`, file.type);
      }
      if (!isValidSize) {
        console.warn(`File too large for ${file.name}:`, file.size);
      }
      
      return isValidType && isValidSize;
    });
    
    if (validFiles.length < files.length) {
      alert(`Some files were skipped. Only video files under 500MB are allowed.`);
    }

    if (validFiles.length === 0) return;

    try {
      setUploading(true);
      
      for (const [index, file] of validFiles.entries()) {
        const progressKey = `video_${Date.now()}_${index}`;
        
        // Add preview immediately
        const preview = {
          id: progressKey,
          url: URL.createObjectURL(file),
          uploading: true,
          progress: 0,
          backendToS3Upload: true
        };
        
        setVideoPreviews(prev => [...prev, preview]);
        
        try {
          // Create FormData for backend upload
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          uploadFormData.append('content_type', 'reel');
          uploadFormData.append('file_type', 'video');
          
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
                setVideoPreviews(prev => prev.map(p => 
                  p.id === progressKey ? { ...p, progress } : p
                ));
                
                // Update progress tracking
                setUploadProgress(prev => ({
                  ...prev,
                  video: { ...prev.video, [progressKey]: progress }
                }));
              }
            }
          });
          
          if (response.data && response.data.success) {
            console.log('Backend-to-S3 video upload successful:', response.data);
            
            // Update preview with successful upload
            setVideoPreviews(prev => prev.map(p => 
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
              video_url: response.data.cloudfront_url || response.data.s3_url
            }));
            
          } else {
            throw new Error(response.data?.message || 'Upload failed');
          }
          
        } catch (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          
          // Update preview with error state
          setVideoPreviews(prev => prev.map(p => 
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
      console.error('Error in video upload process:', error);
      alert('Failed to start upload process. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Enhanced handleThumbnailUpload using backend-to-S3 approach
  const handleThumbnailUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    console.log(`Selected ${files.length} new thumbnails for backend-to-S3 upload`);
    
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
      setUploading(true);
      
      for (const [index, file] of validFiles.entries()) {
        const progressKey = `thumbnail_${Date.now()}_${index}`;
        
        // Add preview immediately
        const preview = {
          id: progressKey,
          url: URL.createObjectURL(file),
          uploading: true,
          progress: 0,
          backendToS3Upload: true
        };
        
        setThumbnailPreviews(prev => [...prev, preview]);
        
        try {
          // Create FormData for backend upload
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          uploadFormData.append('content_type', 'reel');
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
                setThumbnailPreviews(prev => prev.map(p => 
                  p.id === progressKey ? { ...p, progress } : p
                ));
                
                // Update progress tracking
                setUploadProgress(prev => ({
                  ...prev,
                  thumbnail: { ...prev.thumbnail, [progressKey]: progress }
                }));
              }
            }
          });
          
          if (response.data && response.data.success) {
            console.log('Backend-to-S3 thumbnail upload successful:', response.data);
            
            // Update preview with successful upload
            setThumbnailPreviews(prev => prev.map(p => 
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
              thumbnail_url: response.data.cloudfront_url || response.data.s3_url
            }));
            
          } else {
            throw new Error(response.data?.message || 'Upload failed');
          }
          
        } catch (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          
          // Update preview with error state
          setThumbnailPreviews(prev => prev.map(p => 
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
      console.error('Error in thumbnail upload process:', error);
      alert('Failed to start upload process. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  // Updated handleSubmit function for backend-to-S3 uploads
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.video_url && !isEditing) {
        setError('Video is required');
        return;
      }
      
      setUploading(true);
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Not authenticated as admin');
        setUploading(false);
        return;
      }
      
      // Create data for API request
      const reelData = {
        title: formData.title,
        description: formData.description,
        featured: formData.featured,
        video_url: formData.video_url,
        thumbnail_url: formData.thumbnail_url
      };
      
      console.log('Saving reel with backend-to-S3 uploaded media:', reelData);
      
      // Make the API request
      if (isEditing && editingReelId) {
        // Update existing reel
        await api.patch(`/api/reels/${editingReelId}/`, reelData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setIsEditing(false);
        setEditingReelId(null);
      } else {
        // Create new reel
        await api.post('/api/reels/', reelData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Reset form and close modal
      resetForm();
      setShowUploadModal(false);
      fetchReels();
      
    } catch (err) {
      console.error('Error saving reel:', err);
      setError(err.response?.data?.detail || 'Failed to save reel. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reel?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      await api.delete(`/api/reels/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReels(prevReels => prevReels.filter(reel => reel.id !== id));
    } catch (err) {
      console.error('Error deleting reel:', err);
      setError('Failed to delete reel. Please try again.');
    }
  };
  
  const handleEdit = (reel) => {
    setFormData({
      title: reel.title || '',
      description: reel.description || '',
      video_url: reel.video_url || '',
      thumbnail_url: reel.thumbnail_url || '',
      featured: reel.featured || false
    });
    
    // Set previews for existing media
    if (reel.video_url) {
      setVideoPreviews([{
        id: 'existing_video',
        url: reel.video_url,
        uploading: false,
        backendToS3Upload: true,
        existing: true
      }]);
    }
    
    if (reel.thumbnail_url) {
      setThumbnailPreviews([{
        id: 'existing_thumbnail',
        url: reel.thumbnail_url,
        uploading: false,
        backendToS3Upload: true,
        existing: true
      }]);
    }
    
    setIsEditing(true);
    setEditingReelId(reel.id);
    setShowUploadModal(true);
  };
  
  const handleLinkProducts = (reel) => {
    setSelectedReel(reel);
    setSelectedProducts(reel.products || []);
    setProducts(allProducts);
    setShowLinkProductsModal(true);
  };
  
  const handleSearchProducts = (e) => {
    setSearchTerm(e.target.value);
    
    if (e.target.value) {
      const filtered = allProducts.filter(
        product => product.title.toLowerCase().includes(e.target.value.toLowerCase())
      );
      setProducts(filtered);
    } else {
      setProducts(allProducts);
    }
  };
  
  const handleToggleProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };
  
  const handleSaveProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      await api.post(`/api/reels/${selectedReel.id}/link_products/`, {
        product_ids: selectedProducts
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowLinkProductsModal(false);
      fetchReels();
    } catch (err) {
      console.error('Error linking products:', err);
      setError('Failed to link products. Please try again.');
    }
  };
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      featured: false
    });
    setVideoPreviews([]);
    setThumbnailPreviews([]);
    setUploadProgress({ video: {}, thumbnail: {} });
    setIsEditing(false);
    setEditingReelId(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const removeVideo = (index) => {
    setVideoPreviews(prev => {
      const newPreviews = [...prev];
      const removed = newPreviews.splice(index, 1)[0];
      if (removed && removed.url && !removed.existing) {
        URL.revokeObjectURL(removed.url);
      }
      return newPreviews;
    });
    
    // Clear form data if no videos left
    if (videoPreviews.length <= 1) {
      setFormData(prev => ({ ...prev, video_url: '' }));
    }
  };

  const removeThumbnail = (index) => {
    setThumbnailPreviews(prev => {
      const newPreviews = [...prev];
      const removed = newPreviews.splice(index, 1)[0];
      if (removed && removed.url && !removed.existing) {
        URL.revokeObjectURL(removed.url);
      }
      return newPreviews;
    });
    
    // Clear form data if no thumbnails left
    if (thumbnailPreviews.length <= 1) {
      setFormData(prev => ({ ...prev, thumbnail_url: '' }));
    }
  };
  
  return (
    <div className="admin-reels-container">
      <div className="admin-reels-header">
        <h1>Reels Management (Backend-to-S3 Upload)</h1>
        <button 
          className="upload-reel-btn"
          onClick={() => {
            resetForm();
            setShowUploadModal(true);
          }}
        >
          <Plus size={18} />
          <span>Upload New Reel</span>
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="loading-container">
          <div className="loader"></div>
        </div>
      ) : (
        <div className="reels-grid">
          {Array.isArray(reels) && reels.length > 0 ? (
            reels.map(reel => (
              <div key={reel.id} className="reel-card">
                <div className="reel-thumbnail">
                  {reel.thumbnail_url ? (
                    <img 
                      src={getImageUrl(reel.thumbnail_url)} 
                      alt={reel.title}
                      className="thumbnail-image"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="thumbnail-placeholder">
                      <Video size={40} className="placeholder-icon" />
                    </div>
                  )}
                  <div className="thumbnail-overlay">
                    <Play size={48} className="play-icon" />
                    {reel.featured && (
                      <span className="featured-badge">Featured</span>
                    )}
                  </div>
                </div>
                <div className="reel-info">
                  <h3 className="reel-title">{reel.title}</h3>
                  <p className="reel-description">{reel.description}</p>
                  <div className="reel-stats">
                    <span className="views-count">{reel.views || 0} views</span>
                    <span className="likes-count">{reel.likes_count || 0} likes</span>
                  </div>
                </div>
                <div className="reel-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(reel)}
                    title="Edit Reel"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    className="link-products-btn"
                    onClick={() => handleLinkProducts(reel)}
                    title="Link Products"
                  >
                    <Link size={18} />
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(reel.id)}
                    title="Delete Reel"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            ))
          ):(
            <div className="no-reels">
              <Video size={48} />
              <p>No reels found. Click "Upload New Reel" to add your first reel.</p>
            </div>
          )}
        </div>
      )}
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="upload-modal">
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Reel (Backend-to-S3)' : 'Upload New Reel (Backend-to-S3)'}</h2>
              <button 
                className="close-modal-btn"
                onClick={() => {
                  resetForm();
                  setShowUploadModal(false);
                }}
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="upload-form">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                  className="form-input"
                  placeholder="Enter reel title..."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={4}
                  required
                  className="form-textarea"
                  placeholder="Enter reel description..."
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Reel Video (Backend-to-S3 Upload) {!isEditing && '*'}
                </label>
                
                <div className="media-upload-section">
                  {videoPreviews.map((preview, index) => (
                    <div key={preview.id} className="media-preview-container">
                      <video 
                        src={preview.url} 
                        className="video-preview"
                        controls
                      />
                      {preview.uploading && (
                        <div className="upload-overlay">
                          <div className="upload-spinner"></div>
                          <span className="upload-progress">{preview.progress || 0}%</span>
                        </div>
                      )}
                      {preview.backendToS3Upload && (
                        <div className="upload-badge">Backend→S3</div>
                      )}
                      {preview.error && (
                        <div className="error-overlay">
                          <span className="error-text">Error</span>
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => removeVideo(index)} 
                        className="remove-media-btn"
                        title="Remove video"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  
                  {videoPreviews.length === 0 && (
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="media-upload-btn"
                      disabled={uploading}
                    >
                      <Video size={24} />
                      <span>Select Video</span>
                    </button>
                  )}
                  
                  <input 
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    className="hidden-input"
                    onChange={handleVideoUpload}
                  />
                </div>
                <small className="form-help">
                  Upload video to backend server then push to S3. Max 500MB per video.
                </small>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Thumbnail (Backend-to-S3 Upload)
                </label>
                
                <div className="media-upload-section">
                  {thumbnailPreviews.map((preview, index) => (
                    <div key={preview.id} className="media-preview-container">
                      <img 
                        src={preview.url} 
                        alt="Thumbnail preview"
                        className="thumbnail-preview"
                      />
                      {preview.uploading && (
                        <div className="upload-overlay">
                          <div className="upload-spinner"></div>
                          <span className="upload-progress">{preview.progress || 0}%</span>
                        </div>
                      )}
                      {preview.backendToS3Upload && (
                        <div className="upload-badge">Backend→S3</div>
                      )}
                      {preview.error && (
                        <div className="error-overlay">
                          <span className="error-text">Error</span>
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => removeThumbnail(index)} 
                        className="remove-media-btn"
                        title="Remove thumbnail"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  
                  {thumbnailPreviews.length === 0 && (
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="media-upload-btn"
                      disabled={uploading}
                    >
                      <Camera size={24} />
                      <span>Select Thumbnail</span>
                    </button>
                  )}
                  
                  <input 
                    type="file"
                    ref={thumbnailInputRef}
                    accept="image/*"
                    className="hidden-input"
                    onChange={handleThumbnailUpload}
                  />
                </div>
                <small className="form-help">
                  Upload thumbnail to backend server then push to S3. Max 100MB per image.
                </small>
              </div>
              
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleFormChange}
                />
                <label htmlFor="featured">Featured Reel (shown prominently)</label>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    resetForm();
                    setShowUploadModal(false);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="spinner"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {isEditing ? 'Update Reel' : 'Save Reel'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Link Products Modal */}
      {showLinkProductsModal && selectedReel && (
        <div className="modal-overlay">
          <div className="link-products-modal">
            <div className="modal-header">
              <h2>Link Products to "{selectedReel.title}"</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowLinkProductsModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="search-container">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearchProducts}
                  className="search-input"
                />
              </div>
              <div className="selected-counter">
                {selectedProducts.length} products selected
              </div>
            </div>
            
            <div className="products-list">
              {products.length > 0 ? (
                products.map(product => (
                  <div 
                    key={product.id} 
                    className={`product-item ${selectedProducts.includes(product.id) ? 'selected' : ''}`}
                    onClick={() => handleToggleProduct(product.id)}
                  >
                    <div className="product-image">
                      <img 
                        src={product.images && product.images.length > 0 ? getImageUrl(product.images[0]) : '/images/placeholder.jpg'} 
                        alt={product.title}
                        onError={handleImageError}
                      />
                    </div>
                    <div className="product-info">
                      <h4>{product.title}</h4>
                      <p>₹{product.price.toLocaleString()}</p>
                    </div>
                    <div className="product-checkbox">
                      <CheckSquare 
                        size={20} 
                        className={selectedProducts.includes(product.id) ? 'checked' : 'unchecked'}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-products-found">
                  <p>No products found matching your search.</p>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowLinkProductsModal(false)}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={handleSaveProducts}
              >
                Save Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReelsManagement;