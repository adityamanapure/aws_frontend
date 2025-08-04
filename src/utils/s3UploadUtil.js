import axios from 'axios';

/**
 * Upload file to S3 using AWS SDK v3 approach (PutObjectCommand equivalent)
 * Mimics the @aws-sdk/client-s3 PutObjectCommand method
 */

/**
 * Upload media file to S3 using AWS SDK v3 approach and return CloudFront URL
 * 
 * @param {File} file - The file to upload
 * @param {string} contentType - The type of content ('product', 'category', 'reel', 'hero_slide')
 * @param {Object} options - Additional options (metadata, onProgress, etc.)
 * @returns {Promise<Object>} - The uploaded file info including S3/CloudFront URL
 */
export const uploadToS3 = async (file, contentType = 'product', options = {}) => {
  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file provided for upload');
  }

  const token = localStorage.getItem('adminToken');
  if (!token) {
    throw new Error('No admin authentication token found');
  }

  try {
    console.log(`Starting AWS SDK v3 style upload for ${file.name} (${file.size} bytes)...`);
    
    // Create FormData (equivalent to preparing the file for readFile)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('content_type', contentType);
    
    // Add any additional metadata
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    
    // Call progress callback if provided (start)
    if (options.onProgress) {
      options.onProgress(0);
    }
    
    // Upload using AWS SDK v3 style endpoint (PutObjectCommand equivalent)
    const response = await axios.post('/api/admin/upload/v3/', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (options.onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          options.onProgress(percentCompleted);
        }
      }
    });

    if (response.status !== 200) {
      throw new Error(`Upload failed: ${response.status} - ${response.data?.error || 'Unknown error'}`);
    }

    const result = response.data;
    
    console.log(`Successfully uploaded ${file.name} using AWS SDK v3 approach:`, result);

    // Return standardized response (equivalent to S3Client response)
    return {
      id: result.filename,
      url: result.url,
      cloudFrontUrl: result.cloudfront_url,
      s3Key: result.s3_key,
      originalFilename: result.original_filename,
      type: result.content_type,
      size: result.size,
      bucket: result.bucket,
      region: result.region,
      etag: result.etag,
      versionId: result.version_id,
      uploadMethod: result.upload_method,
      success: true
    };

  } catch (error) {
    console.error(`Error uploading ${file.name} using AWS SDK v3 approach:`, error);
    
    let errorMessage = 'Failed to upload file to S3';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (status === 403) {
        errorMessage = 'Access denied. Check AWS permissions for Stockholm region (eu-north-1).';
      } else if (status === 413) {
        errorMessage = 'File too large. Maximum size is 5GB for single upload.';
      } else if (status === 404) {
        errorMessage = 'S3 bucket "images-fashionkesang" not found in Stockholm region.';
      } else if (data?.error) {
        errorMessage = data.error;
      } else {
        errorMessage = `Server error (${status})`;
      }
    } else if (error.message.includes('EntityTooLarge')) {
      errorMessage = 'File too large. Use multipart upload for files larger than 5GB.';
    } else if (error.message.includes('Network Error')) {
      errorMessage = 'Network error. Please check your connection.';
    } else {
      errorMessage = error.message || 'Unknown error occurred during S3 upload';
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Batch upload multiple files to S3 using AWS SDK v3 approach
 * 
 * @param {Array<File>} files - Array of files to upload
 * @param {string} contentType - The type of content ('product', 'category', 'reel', 'hero_slide')
 * @param {Object} options - Additional options (metadata, onProgress, etc.)
 * @returns {Promise<Array<Object>>} - The uploaded files info
 */
export const batchUploadToS3 = async (files, contentType = 'product', options = {}) => {
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new Error('No files provided for upload');
  }

  console.log(`Starting batch AWS SDK v3 style upload of ${files.length} files...`);
  
  const results = [];
  
  // Process files sequentially (like your main function example)
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      console.log(`Uploading file ${i + 1}/${files.length} using AWS SDK v3: ${file.name}`);
      
      // Call progress callback if provided
      if (options.onProgress) {
        const progress = Math.round((i / files.length) * 100);
        options.onProgress(progress, i, files.length);
      }
      
      const result = await uploadToS3(file, contentType, {
        ...options,
        metadata: {
          ...options.metadata,
          bucketName: 'images-fashionkesang',  // Like your example parameters
          key: `media/${contentType}s/${file.name}`,  // Like your example parameters
          totalFiles: files.length,
          currentFileIndex: i
        },
        onProgress: options.onFileProgress
      });
      
      results.push(result);
      
      console.log(`Successfully uploaded file ${i + 1}/${files.length} using AWS SDK v3 in ${result.region}`);
      
    } catch (error) {
      console.error(`Error uploading file ${i + 1} of ${files.length} (${file.name}) using AWS SDK v3:`, error);
      
      // Handle specific S3 errors (like your example)
      if (error.message.includes('EntityTooLarge')) {
        console.error(
          `Error from S3 while uploading object to images-fashionkesang. ` +
          `The object was too large. To upload objects larger than 5GB, use the S3 console (160GB max) ` +
          `or the multipart upload API (5TB max).`
        );
      }
      
      results.push({
        error: true,
        originalFilename: file.name,
        message: error.message,
        file: file
      });
    }
  }
  
  // Final progress update
  if (options.onProgress) {
    options.onProgress(100, files.length, files.length);
  }
  
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  
  console.log(`Batch AWS SDK v3 upload complete: ${successful.length} successful, ${failed.length} failed`);
  
  return results;
};

// Named exports


// Default export with all utilities (fixed ESLint issue)
const s3UploadUtils = { uploadToS3, batchUploadToS3 };
export default s3UploadUtils;