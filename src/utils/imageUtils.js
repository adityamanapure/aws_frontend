import {
  getBaseUrl,
  MEDIA_PATH,
  PRODUCTS_PATH,
  PRODUCT_UUID,
  convertToCloudFront,
  getCloudFrontUrl,
  CLOUDFRONT_URL
} from '../config/mediaConfig';

// Debug flag - set to true to see detailed logs
const DEBUG = true;

/**
 * Extract a simple filename from a path
 */
const getFilenameFromPath = (path) => {
  if (!path) return '';
  const parts = path.split('/');
  return parts[parts.length - 1];
};

/**
 * Formats an image URL to ensure it's a complete, usable URL using CloudFront
 */
export const getImageUrl = (imageSource, placeholder = '/images/placeholder.jpg') => {
  if (DEBUG) console.log('getImageUrl input:', typeof imageSource, imageSource);
  
  if (!imageSource) {
    return placeholder;
  }
  
  // If it's already a complete CloudFront URL, use it directly
  if (typeof imageSource === 'string' && imageSource.includes('cloudfront.net')) {
    if (DEBUG) console.log('Using existing CloudFront URL:', imageSource);
    return imageSource;
  }
  
  // If it's already an exact S3 URL, convert to CloudFront
  if (typeof imageSource === 'string' && imageSource.includes('s3.amazonaws.com')) {
    const cloudFrontUrl = convertToCloudFront(imageSource);
    if (DEBUG) console.log('Converted S3 URL to CloudFront:', cloudFrontUrl);
    return cloudFrontUrl;
  }
  
  // Extract the image information from various formats
  let imagePath = '';
  
  if (typeof imageSource === 'string') {
    // It's a direct string path or URL
    imagePath = imageSource;
    if (DEBUG) console.log('Using string path:', imagePath);
  } 
  else if (imageSource && typeof imageSource === 'object') {
    // Extract from object formats
    if (imageSource.image) {
      imagePath = imageSource.image;
      if (DEBUG) console.log('Using image.image path:', imagePath);
    } 
    else if (imageSource.url) {
      imagePath = imageSource.url;
      if (DEBUG) console.log('Using image.url path:', imagePath);
    }
    else if (imageSource.src) {
      imagePath = imageSource.src;
      if (DEBUG) console.log('Using image.src path:', imagePath);
    }
  }
  
  // If we have a path/filename, use CloudFront
  if (imagePath) {
    // If it's a path with a specific format that needs the UUID folder structure
    if (imagePath.includes('/products/images/') && !imagePath.includes(PRODUCT_UUID)) {
      const filename = getFilenameFromPath(imagePath);
      const directUrl = `${CLOUDFRONT_URL}/${PRODUCTS_PATH}/${PRODUCT_UUID}/${filename}`;
      if (DEBUG) console.log('Using direct product URL format with UUID:', directUrl);
      return directUrl;
    }
    
    // For all other paths, use the CloudFront URL generator
    const cloudFrontUrl = getCloudFrontUrl(imagePath);
    if (DEBUG) console.log('Generated CloudFront URL:', cloudFrontUrl);
    return cloudFrontUrl;
  }
  
  // If we couldn't extract anything useful, return placeholder
  return placeholder;
};

/**
 * Handle image loading errors with multiple fallback mechanisms
 */
export const handleImageError = (e) => {
  console.error('Image error:', e.target.src);
  
  // Track original URL for debugging
  if (!e.target.dataset.originalSrc) {
    e.target.dataset.originalSrc = e.target.src;
  }
  
  // Track retry attempts
  const retries = parseInt(e.target.dataset.retryCount || '0');
  
  // If we're already at the placeholder, don't try again
  if (e.target.src.includes('/images/placeholder.jpg')) {
    return;
  }
  
  // First retry: Convert S3 URL to CloudFront if not already
  if (retries === 0 && e.target.src.includes('s3.amazonaws.com')) {
    e.target.dataset.retryCount = '1';
    const convertedUrl = convertToCloudFront(e.target.src);
    if (convertedUrl !== e.target.src) {
      console.log('Retrying with CloudFront URL:', convertedUrl);
      e.target.src = convertedUrl;
      return;
    }
  }
  
  // Second retry: Try a different path structure
  if (retries <= 1) {
    e.target.dataset.retryCount = '2';
    const originalSrc = e.target.dataset.originalSrc;
    const filename = getFilenameFromPath(originalSrc);
    
    if (filename) {
      // Try with direct products/images path
      const alternativePath = `${CLOUDFRONT_URL}/${PRODUCTS_PATH}/${filename}`;
      console.log('Retrying with alternative path structure:', alternativePath);
      e.target.src = alternativePath;
      return;
    }
  }
  
  // Final retry: Try with UUID path but no products/images
  if (retries <= 2) {
    e.target.dataset.retryCount = '3';
    const originalSrc = e.target.dataset.originalSrc;
    const filename = getFilenameFromPath(originalSrc);
    
    if (filename) {
      // Try with direct media path
      const simplePath = `${CLOUDFRONT_URL}/${MEDIA_PATH}/${filename}`;
      console.log('Final retry with simple path:', simplePath);
      e.target.src = simplePath;
      return;
    }
  }
  
  // All retries failed, use placeholder
  console.error('All retries failed, using placeholder');
  e.target.onerror = null;
  e.target.src = '/images/placeholder.jpg';
};

/**
 * Get a video URL using CloudFront
 */
export const getVideoUrl = (videoSource, placeholder = null) => {
  if (!videoSource) return placeholder;
  
  // If it's a direct URL that already includes CloudFront or S3, process it
  if (typeof videoSource === 'string' && 
      (videoSource.includes('cloudfront.net') || videoSource.includes('s3.amazonaws.com'))) {
    return convertToCloudFront(videoSource);
  }
  
  // Extract video path from object formats
  let videoPath = '';
  
  if (typeof videoSource === 'string') {
    videoPath = videoSource;
  } else if (videoSource && typeof videoSource === 'object') {
    if (videoSource.video) {
      videoPath = videoSource.video;
    } else if (videoSource.url) {
      videoPath = videoSource.url;
    } else if (videoSource.src) {
      videoPath = videoSource.src;
    }
  }
  
  // Generate CloudFront URL for the video
  if (videoPath) {
    return getCloudFrontUrl(videoPath);
  }
  
  return placeholder;
};

/**
 * Create a CloudFront thumbnail URL for a video
 */
export const getVideoThumbnailUrl = (videoSource, placeholder = '/images/video-placeholder.jpg') => {
  if (!videoSource) return placeholder;
  
  let thumbnailPath = '';
  
  // Extract thumbnail path from object formats
  if (typeof videoSource === 'object' && videoSource !== null) {
    if (videoSource.thumbnail) {
      thumbnailPath = videoSource.thumbnail;
    } else if (videoSource.video) {
      // Generate thumbnail name from video (replace extension with jpg)
      const videoName = getFilenameFromPath(videoSource.video);
      thumbnailPath = videoName.replace(/\.[^.]+$/, '.jpg');
    }
  } else if (typeof videoSource === 'string') {
    // Generate thumbnail name from video (replace extension with jpg)
    const videoName = getFilenameFromPath(videoSource);
    thumbnailPath = videoName.replace(/\.[^.]+$/, '.jpg');
  }
  
  if (thumbnailPath) {
    // First check if it already includes CloudFront or S3
    if (thumbnailPath.includes('cloudfront.net') || thumbnailPath.includes('s3.amazonaws.com')) {
      return convertToCloudFront(thumbnailPath);
    }
    
    // Otherwise build CloudFront URL
    return getCloudFrontUrl(thumbnailPath);
  }
  
  return placeholder;
};

export default {
  getImageUrl,
  handleImageError,
  getVideoUrl,
  getVideoThumbnailUrl,
  getFilenameFromPath
};