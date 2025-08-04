import React, { useState, useEffect, useRef } from 'react';
import '../../styles/admin/ProductManagement.css';

import api from '../../services/api';
import { Search, Plus, Edit, Trash2, X, Camera, Film, Save, ChevronDown, ChevronUp, Filter, Grid, List } from 'lucide-react';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Form state - Updated for backend-to-S3 uploads
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    discount_percentage: '',
    stock: '',
    category_id: '',
    images: [],
    videos: [],
    s3_images: [], // Store S3 URLs from backend uploads
    s3_videos: [], // Store S3 URLs from backend uploads
    tags: ''
  });

  // Preview state
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState({
    images: {},
    videos: {}
  });

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
        console.error(`Invalid file type: ${file.type} for ${file.name}`);
      }
      
      if (!isValidSize) {
        console.error(`File too large (${(file.size/1024/1024).toFixed(2)}MB): ${file.name}`);
      }
      
      return isValidType && isValidSize;
    });
    
    if (validFiles.length < files.length) {
      alert(`${files.length - validFiles.length} files were skipped due to invalid type or size.`);
    }

    if (validFiles.length === 0) return;

    try {
      setFormSubmitting(true);
      
      // Create temporary previews with blob URLs
      const tempPreviews = validFiles.map(file => ({
        url: URL.createObjectURL(file),
        file: file,
        name: file.name,
        existingImage: false,
        uploading: true,
        id: `temp-${Date.now()}-${Math.random()}`,
        progress: 0
      }));
      
      setImagePreviews(prev => [...prev, ...tempPreviews]);
      
      console.log(`Starting backend-to-S3 upload of ${validFiles.length} images...`);
      
      // Upload files to backend which will then push to S3
      const uploadPromises = validFiles.map(async (file, index) => {
        const tempId = tempPreviews[index].id;
        
        try {
          console.log(`Uploading file ${index + 1}/${validFiles.length} to backend: ${file.name}`);
          
          // Create FormData for backend upload
          const formData = new FormData();
          formData.append('file', file);
          formData.append('content_type', 'product');
          formData.append('file_type', 'image');
          
          const token = localStorage.getItem('adminToken');
          
          // Upload to backend with progress tracking
          const result = await api.post('/api/admin/upload/backend-to-s3/', formData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              
              // Update progress for this specific file
              setUploadProgress(prev => ({
                ...prev,
                images: {
                  ...prev.images,
                  [tempId]: percentCompleted
                }
              }));
              
              // Update preview progress
              setImagePreviews(prevPreviews => 
                prevPreviews.map(preview => 
                  preview.id === tempId 
                    ? { ...preview, progress: percentCompleted }
                    : preview
                )
              );
              
              console.log(`Backend upload progress for ${file.name}: ${percentCompleted}%`);
            }
          });
          
          if (result.status === 200 || result.status === 201) {
            console.log(`Successfully uploaded ${file.name} via backend to S3:`, result.data);
            
            return {
              ...result.data,
              originalFilename: file.name,
              success: true,
              tempId: tempId
            };
          } else {
            throw new Error(`Backend upload failed: ${result.status}`);
          }
          
        } catch (error) {
          console.error(`Backend-to-S3 upload failed for ${file.name}:`, error);
          
          let errorMessage = 'Upload failed';
          if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          return {
            error: true,
            originalFilename: file.name,
            message: errorMessage,
            file: file,
            tempId: tempId
          };
        }
      });
      
      const uploadResults = await Promise.all(uploadPromises);
      
      console.log('Backend-to-S3 upload results:', uploadResults);
      
      // Process upload results
      const successfulUploads = uploadResults.filter(result => !result.error);
      const failedUploads = uploadResults.filter(result => result.error);
      
      // Update image previews with S3 URLs (replace temp URLs with real S3 URLs)
      setImagePreviews(prev => {
        return prev.map(preview => {
          const matchingResult = uploadResults.find(r => r.tempId === preview.id);
          
          if (matchingResult && !matchingResult.error) {
            // Revoke the blob URL since we have the real S3 URL now
            URL.revokeObjectURL(preview.url);
            
            // Successful upload - replace with S3 URL
            return {
              ...preview,
              url: matchingResult.cloudfront_url || matchingResult.s3_url || matchingResult.url,
              originalUrl: matchingResult.s3_url || matchingResult.url,
              uploading: false,
              s3Uploaded: true,
              s3Id: matchingResult.unique_filename || matchingResult.id,
              s3Data: matchingResult,
              backendToS3Upload: true, // Mark as backend-to-S3 upload
              s3Key: matchingResult.s3_key,
              bucket: matchingResult.bucket,
              region: matchingResult.region,
              progress: 100
            };
          } else if (matchingResult && matchingResult.error) {
            // Failed upload
            return {
              ...preview,
              uploading: false,
              error: true,
              errorMessage: matchingResult.message || 'Upload failed',
              progress: 0
            };
          }
          return preview;
        });
      });
      
      // Update form data with S3 URLs
      if (successfulUploads.length > 0) {
        const currentS3Images = formData.s3_images || [];
        
        setFormData(prev => ({
          ...prev,
          images: [], // Clear local files since they're now on S3
          s3_images: [
            ...currentS3Images,
            ...successfulUploads.map(result => ({
              id: result.unique_filename || result.id,
              url: result.s3_url || result.url,
              cloudFrontUrl: result.cloudfront_url,
              originalFilename: result.originalFilename,
              s3Key: result.s3_key,
              bucket: result.bucket,
              region: result.region,
              uploadMethod: 'backend_to_s3'
            }))
          ]
        }));
        
        console.log(`Successfully uploaded ${successfulUploads.length} images via backend to S3`);
      }
      
      // Handle failed uploads
      if (failedUploads.length > 0) {
        console.error('Failed backend-to-S3 uploads:', failedUploads);
        
        const errorMessages = failedUploads.map(upload => 
          `${upload.originalFilename}: ${upload.message}`
        ).join('\n');
        
        alert(`${failedUploads.length} image(s) failed to upload:\n\n${errorMessages}\n\nPlease try again.`);
      }
      
    } catch (error) {
      console.error('Error during backend-to-S3 image upload:', error);
      alert(`There was an error uploading images: ${error.message}. Please try again.`);
      
      // Reset uploading state for all previews
      setImagePreviews(prev => prev.map(preview => ({
        ...preview,
        uploading: false,
        error: true,
        errorMessage: error.message,
        progress: 0
      })));
    } finally {
      setFormSubmitting(false);
      // Clear upload progress
      setUploadProgress(prev => ({ ...prev, images: {} }));
      // Clear the file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Enhanced handleVideoUpload using backend-to-S3 approach
  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('video/');
      const isValidSize = file.size <= 500 * 1024 * 1024; // 500MB limit
      
      if (!isValidType) {
        console.error(`Invalid file type: ${file.type} for ${file.name}`);
      }
      
      if (!isValidSize) {
        console.error(`File too large (${(file.size/1024/1024).toFixed(2)}MB): ${file.name}`);
      }
      
      return isValidType && isValidSize;
    });
    
    if (validFiles.length < files.length) {
      alert(`${files.length - validFiles.length} files were skipped due to invalid type or size.`);
    }

    if (validFiles.length === 0) return;

    try {
      setFormSubmitting(true);
      
      // Create temporary video previews
      const tempPreviews = validFiles.map(file => ({
        url: URL.createObjectURL(file),
        file: file,
        name: file.name,
        existingVideo: false,
        uploading: true,
        id: `temp-video-${Date.now()}-${Math.random()}`,
        progress: 0
      }));
      
      setVideoPreviews(prev => [...prev, ...tempPreviews]);
      
      console.log(`Starting backend-to-S3 video upload...`);
      
      // Upload videos to backend which will then push to S3
      const uploadPromises = validFiles.map(async (file, index) => {
        const tempId = tempPreviews[index].id;
        
        try {
          console.log(`Uploading video ${index + 1}/${validFiles.length} to backend: ${file.name}`);
          
          // Create FormData for backend upload
          const formData = new FormData();
          formData.append('file', file);
          formData.append('content_type', 'product');
          formData.append('file_type', 'video');
          
          const token = localStorage.getItem('adminToken');
          
          // Upload to backend with progress tracking
          const result = await api.post('/api/admin/upload/backend-to-s3/', formData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              
              // Update progress for this specific file
              setUploadProgress(prev => ({
                ...prev,
                videos: {
                  ...prev.videos,
                  [tempId]: percentCompleted
                }
              }));
              
              // Update preview progress
              setVideoPreviews(prevPreviews => 
                prevPreviews.map(preview => 
                  preview.id === tempId 
                    ? { ...preview, progress: percentCompleted }
                    : preview
                )
              );
              
              console.log(`Backend video upload progress for ${file.name}: ${percentCompleted}%`);
            }
          });
          
          if (result.status === 200 || result.status === 201) {
            console.log(`Successfully uploaded video ${file.name} via backend to S3:`, result.data);
            
            return {
              ...result.data,
              originalFilename: file.name,
              success: true,
              tempId: tempId
            };
          } else {
            throw new Error(`Backend video upload failed: ${result.status}`);
          }
          
        } catch (error) {
          console.error(`Backend-to-S3 video upload failed for ${file.name}:`, error);
          
          let errorMessage = 'Video upload failed';
          if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          return {
            error: true,
            originalFilename: file.name,
            message: errorMessage,
            file: file,
            tempId: tempId
          };
        }
      });
      
      const uploadResults = await Promise.all(uploadPromises);
      
      console.log('Backend-to-S3 video upload results:', uploadResults);
      
      // Update video previews with S3 URLs
      setVideoPreviews(prev => {
        return prev.map(preview => {
          const matchingResult = uploadResults.find(r => r.tempId === preview.id);
          
          if (matchingResult && !matchingResult.error) {
            // Revoke blob URL to prevent memory leaks
            URL.revokeObjectURL(preview.url);
            
            return {
              ...preview,
              url: matchingResult.cloudfront_url || matchingResult.s3_url || matchingResult.url,
              originalUrl: matchingResult.s3_url || matchingResult.url,
              uploading: false,
              s3Uploaded: true,
              s3Id: matchingResult.unique_filename || matchingResult.id,
              backendToS3Upload: true,
              s3Key: matchingResult.s3_key,
              bucket: matchingResult.bucket,
              region: matchingResult.region,
              progress: 100
            };
          } else if (matchingResult && matchingResult.error) {
            return {
              ...preview,
              uploading: false,
              error: true,
              errorMessage: matchingResult.message || 'Upload failed',
              progress: 0
            };
          }
          return preview;
        });
      });
      
      // Update form data with S3 video URLs
      const successfulUploads = uploadResults.filter(result => !result.error);
      if (successfulUploads.length > 0) {
        setFormData(prev => ({
          ...prev,
          videos: [], // Clear local files
          s3_videos: [
            ...(prev.s3_videos || []),
            ...successfulUploads.map(result => ({
              id: result.unique_filename || result.id,
              url: result.s3_url || result.url,
              cloudFrontUrl: result.cloudfront_url,
              originalFilename: result.originalFilename,
              s3Key: result.s3_key,
              bucket: result.bucket,
              region: result.region,
              uploadMethod: 'backend_to_s3'
            }))
          ]
        }));
        
        console.log(`Successfully uploaded ${successfulUploads.length} videos via backend to S3`);
      }
      
      // Handle failed video uploads
      const failedUploads = uploadResults.filter(result => result.error);
      if (failedUploads.length > 0) {
        console.error('Failed backend-to-S3 video uploads:', failedUploads);
        
        const errorMessages = failedUploads.map(upload => 
          `${upload.originalFilename}: ${upload.message}`
        ).join('\n');
        
        alert(`${failedUploads.length} video(s) failed to upload:\n\n${errorMessages}\n\nPlease try again.`);
      }
      
    } catch (error) {
      console.error('Error uploading videos via backend to S3:', error);
      alert('There was an error uploading some videos. Please try again.');
    } finally {
      setFormSubmitting(false);
      // Clear upload progress
      setUploadProgress(prev => ({ ...prev, videos: {} }));
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      if (selectedCategory !== 'all' && viewMode === 'sections') {
        const response = await api.get(`/api/admin/categories/${selectedCategory}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Product images from category:', response.data.map(p => ({ id: p.id, images: p.images })));
        setProducts(response.data);
      } else {
        const response = await api.get('/api/admin/products', {
          headers: { Authorization: `Bearer ${token}` },
          params: { sort_field: sortField, sort_direction: sortDirection }
        });
        console.log('Product images:', response.data.map(p => ({ id: p.id, images: p.images })));
        setProducts(response.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Error fetching products. Please try again.');
      setLoading(false);
    }
  };

  const getProductsByCategory = (categoryId) => {
    if (categoryId === 'all') {
      return products;
    }
    return products.filter(product => product.category_id === parseInt(categoryId));
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await api.get('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Error loading categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

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

  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      discount_percentage: '',
      stock: '',
      category_id: '',
      images: [],
      videos: [],
      s3_images: [],
      s3_videos: [],
      tags: ''
    });
    
    // Clean up any blob URLs
    imagePreviews.forEach(preview => {
      if (preview.url && preview.url.startsWith('blob:')) {
        URL.revokeObjectURL(preview.url);
      }
    });
    
    videoPreviews.forEach(preview => {
      if (preview.url && preview.url.startsWith('blob:')) {
        URL.revokeObjectURL(preview.url);
      }
    });
    
    setImagePreviews([]);
    setVideoPreviews([]);
    setIsEditing(false);
    setSelectedProduct(null);
    setError(null);
    setUploadProgress({ images: {}, videos: {} });
  };

  const handleAddProduct = () => {
    setIsEditing(false);
    resetForm();
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setIsEditing(true);
    setSelectedProduct(product);
    
    setFormData({
      title: product.title || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      discount_percentage: product.discount_percentage?.toString() || '',
      stock: product.stock?.toString() || '',
      category_id: product.category_id?.toString() || '',
      images: [],
      videos: [],
      s3_images: [],
      s3_videos: [],
      tags: product.tags?.join(', ') || ''
    });

    // Updated image preview handling for backend-to-S3 URLs
    if (product.images && product.images.length > 0) {
      const imagePreviews = product.images.map((img, index) => {
        console.log('Setting up image preview:', { index, img });
        
        // Handle both string URLs (from backend-to-S3) and object formats
        let imageUrl = '';
        
        if (typeof img === 'string') {
          imageUrl = img;
        } else if (img && typeof img === 'object') {
          imageUrl = img.url || img.image || img.src || '';
        }
        
        console.log('Final preview URL:', imageUrl);
        
        return {
          id: `existing_${index}`,
          url: imageUrl,
          file: null,
          existingImage: true,
          originalUrl: imageUrl,
          backendToS3Upload: imageUrl.includes('cloudfront.net') || imageUrl.includes('s3.amazonaws.com'),
          uploading: false
        };
      });
      
      setImagePreviews(imagePreviews);
    } else {
      setImagePreviews([]);
    }

    // Updated video preview handling for backend-to-S3 URLs
    if (product.videos && product.videos.length > 0) {
      const videoPreviews = product.videos.map((video, index) => {
        const videoUrl = typeof video === 'string' ? video : video.url;
        return { 
          id: `existing_video_${index}`,
          url: videoUrl,
          file: null,
          existingVideo: true,
          originalUrl: videoUrl,
          backendToS3Upload: videoUrl.includes('cloudfront.net') || videoUrl.includes('s3.amazonaws.com'),
          uploading: false
        };
      });
      setVideoPreviews(videoPreviews);
    } else {
      setVideoPreviews([]);
    }

    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await api.delete(`/api/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProducts(products.filter(product => product.id !== productId));
    } catch (err) {
      setError('Error deleting product. Please try again.');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');
      
      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category_id: parseInt(formData.category_id),
      };
      
      if (formData.discount_percentage) {
        productData.discount_percentage = parseFloat(formData.discount_percentage);
      }
      
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      if (tags.length > 0) {
        productData.tags = tags;
      }
      
      const existingImages = imagePreviews
        .filter(preview => preview.existingImage)
        .map(preview => preview.originalUrl);
      
      if (existingImages.length > 0) {
        productData.existing_images = existingImages;
      }
      
      if (formData.s3_images && formData.s3_images.length > 0) {
        productData.s3_images = formData.s3_images;
      }
      
      if (formData.s3_videos && formData.s3_videos.length > 0) {
        productData.s3_videos = formData.s3_videos;
      }

      console.log('Sending product data (Backend-to-S3 Upload):', productData);

      let response;
      if (isEditing) {
        response = await api.put(`/api/admin/products/${selectedProduct.id}`, productData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setProducts(products.map(product => 
          product.id === selectedProduct.id ? response.data : product
        ));
      } else {
        response = await api.post('/api/admin/products', productData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setProducts([response.data, ...products]);
      }
      
      setShowProductModal(false);
      resetForm();
      
      alert(isEditing ? 'Product updated successfully using Backend-to-S3 Upload!' : 'Product created successfully using Backend-to-S3 Upload!');
      
    } catch (err) {
      console.error('Error saving product:', err);
      
      if (err.response?.data?.detail) {
        setError(`Error saving product: ${err.response.data.detail}`);
      } else if (err.response?.data) {
        setError(`Error saving product: ${JSON.stringify(err.response.data)}`);
      } else {
        setError('Error saving product. Please try again.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const removeImage = (index) => {
    const newImagePreviews = [...imagePreviews];
    
    const preview = newImagePreviews[index];
    if (preview.url && preview.url.startsWith('blob:')) {
      URL.revokeObjectURL(preview.url);
    }
    
    newImagePreviews.splice(index, 1);
    setImagePreviews(newImagePreviews);
    
    if (!preview.existingImage) {
      const updatedImages = [...formData.images];
      const fileToRemove = updatedImages.findIndex(file => 
        file.name === preview.name || (preview.file && file.name === preview.file.name)
      );
      
      if (fileToRemove !== -1) {
        updatedImages.splice(fileToRemove, 1);
      }
      
      let updatedS3Images = [...(formData.s3_images || [])];
      if (preview.s3Uploaded && preview.s3Id) {
        updatedS3Images = updatedS3Images.filter(img => img.id !== preview.s3Id);
      }
      
      setFormData({
        ...formData,
        images: updatedImages,
        s3_images: updatedS3Images
      });
    }
  };

  const removeVideo = (index) => {
    const newVideoPreviews = [...videoPreviews];
    
    const preview = newVideoPreviews[index];
    if (preview.url && preview.url.startsWith('blob:')) {
      URL.revokeObjectURL(preview.url);
    }
    
    newVideoPreviews.splice(index, 1);
    setVideoPreviews(newVideoPreviews);
    
    if (!preview.existingVideo) {
      const updatedVideos = [...formData.videos];
      const fileToRemove = updatedVideos.findIndex(file => 
        file.name === preview.name || (preview.file && file.name === preview.file.name)
      );
      
      if (fileToRemove !== -1) {
        updatedVideos.splice(fileToRemove, 1);
        setFormData({
          ...formData,
          videos: updatedVideos
        });
      }
      
      if (preview.s3Uploaded && formData.s3_videos) {
        const updatedS3Videos = formData.s3_videos.filter(item => 
          item.url !== preview.originalUrl
        );
        
        setFormData(prev => ({
          ...prev,
          s3_videos: updatedS3Videos
        }));
      }
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [sortField, sortDirection]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, viewMode, sortField, sortDirection]);

  return (
    <div className="admin-products-container">
      <div className="admin-products-header">
        <h2 className="admin-products-title">Manage Products (Backend-to-S3 Upload)</h2>
        
        <div className="admin-products-controls">
          <div className="admin-search-container">
            <input
              type="text"
              placeholder="Search products..."
              className="admin-search-input"
              value={searchQuery}
              onChange={handleSearch}
            />
            <Search className="admin-search-icon" size={18} />
          </div>
          
          <button
            onClick={handleAddProduct}
            className="admin-add-button"
          >
            <Plus size={18} />
            Add Product
          </button>

          <div className="admin-view-controls ml-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100'}`}
                title="List View"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('sections')}
                className={`p-2 rounded ${viewMode === 'sections' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100'}`}
                title="Category Sections"
              >
                <Grid size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {viewMode === 'list' ? (
        loading ? (
          <div className="flex justify-center my-8">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center my-4">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-16 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      Product
                      {sortField === 'title' && (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center">
                      Price
                      {sortField === 'price' && (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('stock')}
                  >
                    <div className="flex items-center">
                      Stock
                      {sortField === 'stock' && (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                          <img 
                            src={(() => {
                              if (!product.images || product.images.length === 0) {
                                return '/images/placeholder.jpg';
                              }
                              
                              const firstImage = product.images[0];
                              console.log('Rendering product image:', { productId: product.id, firstImage });
                              
                              // Handle string URLs (CloudFront/S3 URLs)
                              if (typeof firstImage === 'string') {
                                // If it's already a CloudFront URL, use it directly
                                if (firstImage.includes('cloudfront.net')) {
                                  return firstImage;
                                }
                                // If it's an S3 URL, use it directly (CloudFront should be configured to serve these)
                                if (firstImage.includes('s3.amazonaws.com')) {
                                  return firstImage;
                                }
                                // If it's a relative path, use getImageUrl to convert it
                                return getImageUrl(firstImage);
                              }
                              
                              // Handle object format (legacy)
                              if (typeof firstImage === 'object' && firstImage) {
                                const imageUrl = firstImage.url || firstImage.image || firstImage.src;
                                if (imageUrl) {
                                  // Same logic as above for object URLs
                                  if (imageUrl.includes('cloudfront.net') || imageUrl.includes('s3.amazonaws.com')) {
                                    return imageUrl;
                                  }
                                  return getImageUrl(imageUrl);
                                }
                              }
                              
                              return '/images/placeholder.jpg';
                            })()} 
                            alt={product.title || 'Product image'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image load error for product:', product.id, 'URL:', e.target.src);
                              handleImageError(e);
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{product.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₹{product.price.toLocaleString()}</div>
                        {product.discount_percentage > 0 && (
                          <div className="text-xs text-green-600">
                            {product.discount_percentage}% off
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {categories.find(cat => cat.id === product.category_id)?.name || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="p-1 rounded-full hover:bg-yellow-50 text-yellow-600"
                            title="Edit Product"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1 rounded-full hover:bg-red-50 text-red-600"
                            title="Delete Product"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="mt-6">
          <div className="flex items-center space-x-4 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                selectedCategory === 'all' 
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id.toString())}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${
                  selectedCategory === category.id.toString()
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name} ({category.products_count})
              </button>
            ))}
          </div>
          
          {/* Products grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : getProductsByCategory(selectedCategory).length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No products found in this category
              </div>
            ) : (
              getProductsByCategory(selectedCategory).map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-100 relative">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={(() => {
                          const firstImage = product.images[0];
                          console.log('Grid view - rendering product image:', { productId: product.id, firstImage });
                          
                          // Handle string URLs (CloudFront/S3 URLs)
                          if (typeof firstImage === 'string') {
                            // If it's already a CloudFront URL, use it directly
                            if (firstImage.includes('cloudfront.net')) {
                              return firstImage;
                            }
                            // If it's an S3 URL, use it directly
                            if (firstImage.includes('s3.amazonaws.com')) {
                              return firstImage;
                            }
                            // If it's a relative path, use getImageUrl to convert it
                            return getImageUrl(firstImage);
                          }
                          
                          // Handle object format (legacy)
                          if (typeof firstImage === 'object' && firstImage) {
                            const imageUrl = firstImage.url || firstImage.image || firstImage.src;
                            if (imageUrl) {
                              if (imageUrl.includes('cloudfront.net') || imageUrl.includes('s3.amazonaws.com')) {
                                return imageUrl;
                              }
                              return getImageUrl(imageUrl);
                            }
                          }
                          
                          return '/images/placeholder.jpg';
                        })()} 
                        alt={product.title || 'Product image'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Grid image load error for product:', product.id, 'URL:', e.target.src);
                          handleImageError(e);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <Camera size={40} />
                      </div>
                    )}
                    
                    {/* Quick action buttons */}
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button 
                        onClick={() => handleEditProduct(product)}
                        className="p-1.5 rounded-full bg-white shadow-md text-yellow-600 hover:text-yellow-700"
                        title="Edit Product"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-1.5 rounded-full bg-white shadow-md text-red-600 hover:text-red-700"
                        title="Delete Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="text-sm text-gray-500 mb-1">
                      {product.category_name || 'Uncategorized'}
                    </div>
                    <h3 className="font-medium text-gray-900 truncate" title={product.title}>
                      {product.title}
                    </h3>
                    <div className="mt-2 flex justify-between items-center">
                      <div>
                        <span className="text-lg font-semibold text-gray-900">₹{product.price.toLocaleString()}</span>
                        {product.discount_percentage > 0 && (
                          <span className="ml-2 text-xs text-green-600">
                            {product.discount_percentage}% off
                          </span>
                        )}
                      </div>
                      <span className={`text-sm ${
                        product.stock > 10 ? 'text-green-600' : 
                        product.stock > 0 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Product Modal with Backend-to-S3 upload */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {isEditing ? 'Edit Product (Backend-to-S3 Upload)' : 'Add New Product (Backend-to-S3 Upload)'}
                </h3>
                <button 
                  onClick={() => setShowProductModal(false)}
                  className="text-gray-400 hover:text-gray-500 text-xl"
                >
                  &times;
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="e.g. Gold Necklace with Diamond Pendant"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category 
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    disabled={categoriesLoading}
                  >
                    <option value="">
                      {categoriesLoading ? "Loading categories..." : "Select a category"}
                    </option>
                    {categories.length > 0 ? (
                      categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))
                    ) : !categoriesLoading ? (
                      <option value="" disabled>No categories available</option>
                    ) : null}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="e.g. 2999.99"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    name="discount_percentage"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="e.g. 10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="e.g. 50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="e.g. necklace, gold, diamond"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows="4"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Detailed description of the product..."
                />
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images (Backend-to-S3 Upload)
                </label>
                
                <div className="flex flex-wrap gap-4 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={`img-${index}`} className="relative w-24 h-24 border rounded overflow-hidden">
                      <img 
                        src={preview.url} 
                        alt={`Preview ${index}`} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/placeholder.jpg';
                        }}
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
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:text-gray-500 hover:border-gray-400"
                    disabled={formSubmitting}
                  >
                    <Camera size={24} />
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                <small className="text-gray-500">
                  Files uploaded to backend server then pushed to S3. Max 100MB per file. Progress tracking included.
                </small>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Videos (Backend-to-S3 Upload)
                </label>
                
                <div className="flex flex-wrap gap-4 mb-4">
                  {videoPreviews.map((preview, index) => (
                    <div key={`video-${index}`} className="relative w-32 h-24 border rounded overflow-hidden">
                      <video 
                        src={preview.url} 
                        className="w-full h-full object-cover"
                        controls
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
                        onClick={() => removeVideo(index)} 
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        title="Remove video"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-32 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:text-gray-500 hover:border-gray-400"
                    disabled={formSubmitting}
                  >
                    <Film size={24} />
                  </button>
                  <input 
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    multiple
                    className="hidden"
                    onChange={handleVideoUpload}
                  />
                </div>
                <small className="text-gray-500">
                  Videos uploaded to backend server then pushed to S3. Max 500MB per video. Progress tracking included.
                </small>
              </div>
              
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      {isEditing ? 'Update Product' : 'Save Product'}
                    </>
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

export default ProductManagement;
