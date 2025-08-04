import React, { useState, useEffect } from 'react';
import { useHeroSlides } from '../../context/HeroSlideContext';
import { X, Upload } from 'lucide-react';

const HeroSlideForm = ({ slide, onClose }) => {
  const { addSlide, updateSlide } = useHeroSlides();
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    buttonText: 'Explore Collection',
    buttonLink: '/products',
    image: null,
  });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (slide) {
      setFormData({
        title: slide.title || '',
        subtitle: slide.subtitle || '',
        buttonText: slide.buttonText || 'Explore Collection',
        buttonLink: slide.buttonLink || '/products',
        image: null, // We don't set the file here, just keep the current image URL
      });
      setPreview(slide.image);
    }
  }, [slide]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!preview && !formData.image) {
      setError('Please select an image');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let result;
      
      if (slide) {
        // Update existing slide
        result = await updateSlide(slide.id, formData);
      } else {
        // Create new slide
        result = await addSlide(formData);
      }
      
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to save slide');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="slide-form-container">
      <div className="slide-form-header">
        <h3>{slide ? 'Edit Hero Slide' : 'Add New Hero Slide'}</h3>
        <button 
          className="close-button" 
          onClick={onClose}
          disabled={isSubmitting}
        >
          <X size={20} />
        </button>
      </div>
      
      {error && (
        <div className="form-error">{error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter slide title"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="subtitle">Subtitle</label>
          <input
            type="text"
            id="subtitle"
            name="subtitle"
            value={formData.subtitle}
            onChange={handleChange}
            placeholder="Enter slide subtitle"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="buttonText">Button Text</label>
            <input
              type="text"
              id="buttonText"
              name="buttonText"
              value={formData.buttonText}
              onChange={handleChange}
              placeholder="Enter button text"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="buttonLink">Button Link</label>
            <input
              type="text"
              id="buttonLink"
              name="buttonLink"
              value={formData.buttonLink}
              onChange={handleChange}
              placeholder="Enter button link"
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <div className="form-group image-upload">
          <label>Hero Image</label>
          
          <div className="image-upload-area">
            {preview ? (
              <div className="image-preview">
                <img 
                  src={preview} 
                  alt="Preview" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/placeholder-hero.jpg';
                  }}
                />
                
                <div className="image-actions">
                  <label className="change-image-btn">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="upload-placeholder">
                <Upload size={32} />
                <p>Drag & drop or click to upload image</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>
          
          <p className="image-requirements">
            Recommended size: 1920×800px. Max file size: 2MB.
          </p>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : slide ? 'Update Slide' : 'Add Slide'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HeroSlideForm;