/**
 * AWS S3 and CloudFront configuration
 */

// S3 bucket information
export const S3_BUCKET = 'images-fashionkesang';
export const S3_REGION = 'eu-north-1';
export const S3_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

// CloudFront distribution
export const CLOUDFRONT_URL = 'https://d2v1rwlut2i2wn.cloudfront.net';
export const USE_CLOUDFRONT = true; // Set to false to use direct S3 URLs instead

// Media paths
export const MEDIA_PATH = 'media';
export const PRODUCTS_PATH = `${MEDIA_PATH}/products/images`;
export const PRODUCT_UUID = '06a54283-d7dc-44f2-a419-c3de6aea0be5';

// Get the base URL depending on configuration
export const getBaseUrl = () => {
  return USE_CLOUDFRONT ? CLOUDFRONT_URL : S3_URL;
};

// Convert an S3 URL to a CloudFront URL
export const convertToCloudFront = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // If already using CloudFront, return as is
  if (url.includes(CLOUDFRONT_URL)) return url;
  
  // Convert from S3 to CloudFront
  if (url.includes('s3.amazonaws.com')) {
    const pathMatch = url.match(/https?:\/\/.*?\.s3\..*?\.amazonaws\.com\/(.+)/);
    if (pathMatch && pathMatch[1]) {
      return `${CLOUDFRONT_URL}/${pathMatch[1]}`;
    }
  } 
  
  return url;
};

// Generate a direct CloudFront URL from a path or filename
export const getCloudFrontUrl = (path) => {
  if (!path) return '';
  
  // If it's already a complete URL, convert it
  if (path.startsWith('http')) {
    return convertToCloudFront(path);
  }
  
  // Remove leading slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Make sure we have the media folder in the path
  if (!cleanPath.startsWith(MEDIA_PATH) && !cleanPath.includes('/media/')) {
    return `${CLOUDFRONT_URL}/${MEDIA_PATH}/${cleanPath}`;
  }
  
  return `${CLOUDFRONT_URL}/${cleanPath}`;
};

export default {
  S3_BUCKET,
  S3_REGION,
  S3_URL,
  CLOUDFRONT_URL,
  USE_CLOUDFRONT,
  MEDIA_PATH,
  PRODUCTS_PATH,
  PRODUCT_UUID,
  getBaseUrl,
  convertToCloudFront,
  getCloudFrontUrl
};