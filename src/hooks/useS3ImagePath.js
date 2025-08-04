import { useState, useEffect } from 'react';
import { 
  getBaseUrl, 
  MEDIA_PATH, 
  PRODUCTS_PATH, 
  PRODUCT_UUID 
} from '../config/mediaConfig';

/**
 * Hook to find a working image path and return CloudFront or S3 URL
 */
export const useS3ImagePath = (imageSrc) => {
  const [workingUrl, setWorkingUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!imageSrc) {
      setLoading(false);
      setError('No image source provided');
      return;
    }
    
    const fetchImage = async () => {
      setLoading(true);
      setError(null);
      
      // Extract filename based on source type
      let filename = '';
      
      if (typeof imageSrc === 'string') {
        const parts = imageSrc.split('/');
        filename = parts[parts.length - 1];
      } else if (imageSrc && typeof imageSrc === 'object') {
        if (imageSrc.image) {
          const parts = imageSrc.image.split('/');
          filename = parts[parts.length - 1];
        } else if (imageSrc.url) {
          const parts = imageSrc.url.split('/');
          filename = parts[parts.length - 1];
        }
      }
      
      if (!filename) {
        setLoading(false);
        setError('Could not extract filename');
        return;
      }
      
      // Get the base URL (CloudFront or S3 depending on configuration)
      const baseUrl = getBaseUrl();
      
      // Use the UUID pattern that works
      const url = `${baseUrl}/${PRODUCTS_PATH}/${PRODUCT_UUID}/${filename}`;
      console.log('Generated image URL:', url);
      
      setWorkingUrl(url);
      setLoading(false);
    };
    
    fetchImage();
  }, [imageSrc]);
  
  return { url: workingUrl, loading, error };
};

export default useS3ImagePath;