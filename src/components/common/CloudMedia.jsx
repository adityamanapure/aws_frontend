import React, { useState, useEffect } from 'react';
import { getImageUrl, handleImageError, getVideoUrl } from '../../utils/imageUtils';

/**
 * CloudMedia component for displaying images and videos from CloudFront/S3
 * 
 * @param {object} props Component props
 * @param {string|object} props.src Source URL or object containing image/video path
 * @param {string} props.type Media type ('image' or 'video')
 * @param {string} props.alt Alternative text for images
 * @param {string} props.className CSS class names
 * @param {string} props.placeholder Placeholder image URL
 * @param {function} props.onLoad Callback when media loads
 * @param {function} props.onError Callback when media fails to load
 * @param {object} props.style Additional inline styles
 * @returns {JSX.Element} Media component
 */
const CloudMedia = ({ 
  src, 
  type = 'image',
  alt = '',
  className = '',
  placeholder = '/images/placeholder.jpg',
  onLoad,
  onError,
  style = {},
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  
  useEffect(() => {
    // Process the source URL based on media type
    if (type === 'video') {
      setMediaUrl(getVideoUrl(src, placeholder));
    } else {
      setMediaUrl(getImageUrl(src, placeholder));
    }
    
    // Reset loading and error states when source changes
    setLoading(true);
    setError(false);
  }, [src, type, placeholder]);
  
  const handleLoad = (e) => {
    setLoading(false);
    if (onLoad) onLoad(e);
  };
  
  const handleError = (e) => {
    if (type === 'image') {
      // Use our custom error handler for images
      handleImageError(e);
      
      // Check if we've reached the placeholder image
      if (e.target.src === placeholder) {
        setError(true);
        setLoading(false);
        if (onError) onError(e);
      }
    } else {
      setError(true);
      setLoading(false);
      if (onError) onError(e);
    }
  };
  
  // Common styles with loading/error state indicators
  const mediaStyle = {
    ...style,
    opacity: loading ? 0 : 1,
    transition: 'opacity 0.3s ease'
  };
  
  // Container styles
  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden'
  };
  
  return (
    <div style={containerStyle} className={`cloud-media-container ${className}-container`}>
      {/* Loading spinner */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            border: '3px solid rgba(0,0,0,0.1)',
            borderRadius: '50%',
            borderTop: '3px solid #333',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      {/* Media element based on type */}
      {type === 'video' ? (
        <video
          src={mediaUrl}
          className={`cloud-video ${className}`}
          style={mediaStyle}
          onLoadedData={handleLoad}
          onError={handleError}
          controls={props.controls || true}
          autoPlay={props.autoPlay || false}
          loop={props.loop || false}
          muted={props.muted || false}
          playsInline={props.playsInline || true}
          {...props}
        />
      ) : (
        <img
          src={mediaUrl}
          alt={alt}
          className={`cloud-image ${className}`}
          style={mediaStyle}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      
      {/* Error state display */}
      {error && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fef1f1',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#721c24' }}>
            {type === 'video' ? 'Video not available' : 'Image not available'}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginTop: '5px',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {alt || 'Media could not be loaded'}
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudMedia;