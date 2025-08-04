import React, { useState } from 'react';
import CloudMedia from './CloudMedia';
import { CLOUDFRONT_URL } from '../../config/mediaConfig';

/**
 * AutoS3Image provides automatic retry logic for S3 images
 */
const AutoS3Image = ({ src, alt, className, placeholder = '/images/placeholder.jpg', ...props }) => {
  const [retryCount, setRetryCount] = useState(0);
  const [finalUrl, setFinalUrl] = useState(null);

  const handleError = (e) => {
    // Only try alternatives if we haven't exhausted retries
    if (retryCount < 3) {
      setRetryCount(prevCount => prevCount + 1);
      
      // Extract filename from source
      let filename = '';
      if (typeof src === 'string') {
        const parts = src.split('/');
        filename = parts[parts.length - 1];
      } else if (src && typeof src === 'object') {
        if (src.image) {
          const parts = src.image.split('/');
          filename = parts[parts.length - 1];
        } else if (src.url) {
          const parts = src.url.split('/');
          filename = parts[parts.length - 1];
        }
      }
      
      if (filename) {
        // Try different path patterns based on retry count
        let newUrl;
        if (retryCount === 0) {
          // Try products/images/UUID path
          newUrl = `${CLOUDFRONT_URL}/media/products/images/06a54283-d7dc-44f2-a419-c3de6aea0be5/${filename}`;
        } else if (retryCount === 1) {
          // Try products/images path
          newUrl = `${CLOUDFRONT_URL}/media/products/images/${filename}`;
        } else {
          // Try media path
          newUrl = `${CLOUDFRONT_URL}/media/${filename}`;
        }
        
        setFinalUrl(newUrl);
        return;
      }
    }
    
    // If we've exhausted retries or can't extract filename, use placeholder
    if (props.onError) props.onError(e);
  };
  
  return (
    <CloudMedia
      src={finalUrl || src}
      type="image"
      alt={alt}
      className={className}
      placeholder={placeholder}
      onError={handleError}
      {...props}
    />
  );
};

export default AutoS3Image;