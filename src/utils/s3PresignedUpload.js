import axios from 'axios';

/**
 * Upload file to S3 using presigned URL for Stockholm region (eu-north-1)
 */
export const uploadToS3WithPresignedUrl = async (file, contentType = 'product', options = {}) => {
  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file provided for upload');
  }

  const token = localStorage.getItem('adminToken');
  if (!token) {
    throw new Error('No admin authentication token found');
  }

  try {
    console.log(`Starting S3 upload for ${file.name} (${file.size} bytes) to Stockholm region...`);
    
    // Step 1: Get presigned URL from backend
    const presignedResponse = await axios.post('/api/admin/upload/presigned-url/', {
      file_name: file.name,
      file_type: file.type,
      content_type: contentType
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const { 
      presigned_url, 
      s3_url, 
      cloudfront_url, 
      s3_key, 
      unique_filename, 
      region, 
      bucket 
    } = presignedResponse.data;
    
    console.log(`Got presigned URL for S3 upload to bucket ${bucket} in region ${region}:`, presigned_url);
    
    // Step 2: Upload directly to S3 using presigned URL
    const uploadResponse = await fetch(presigned_url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => 'Unknown error');
      throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
    }

    console.log(`Successfully uploaded ${file.name} to S3 bucket ${bucket} in region ${region}`);

    // Return the upload result with region info
    return {
      id: unique_filename,
      url: s3_url,
      cloudFrontUrl: cloudfront_url,
      s3Key: s3_key,
      originalFilename: file.name,
      type: file.type,
      size: file.size,
      region: region,
      bucket: bucket,
      success: true
    };

  } catch (error) {
    console.error(`Error uploading ${file.name} to S3:`, error);
    
    let errorMessage = 'Failed to upload file to S3';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (status === 403) {
        errorMessage = 'Access denied. Check AWS permissions for Stockholm region (eu-north-1).';
      } else if (status === 404) {
        errorMessage = 'S3 bucket "images-fashionkesang" not found in Stockholm region.';
      } else if (data?.error) {
        errorMessage = data.error;
      } else {
        errorMessage = `Server error (${status})`;
      }
    } else if (error.message.includes('S3 upload failed')) {
      if (error.message.includes('403')) {
        errorMessage = 'S3 upload denied. Check bucket permissions for eu-north-1 region.';
      } else if (error.message.includes('404')) {
        errorMessage = 'S3 bucket not found. Verify bucket exists in Stockholm region.';
      } else {
        errorMessage = 'Failed to upload to S3 bucket. Please try again.';
      }
    } else if (error.message.includes('Network Error')) {
      errorMessage = 'Network error. Please check your connection.';
    } else {
      errorMessage = error.message || 'Unknown error occurred during S3 upload';
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Batch upload multiple files to S3 using presigned URLs
 */
export const batchUploadToS3WithPresignedUrl = async (files, contentType = 'product', options = {}) => {
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new Error('No files provided for S3 upload');
  }

  console.log(`Starting batch S3 upload of ${files.length} files to Stockholm region...`);
  
  const results = [];
  
  // Process files sequentially to avoid overwhelming the server
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      console.log(`Uploading file ${i + 1}/${files.length} to S3: ${file.name}`);
      
      // Call progress callback if provided
      if (options.onProgress) {
        const progress = Math.round((i / files.length) * 100);
        options.onProgress(progress, i, files.length);
      }
      
      const result = await uploadToS3WithPresignedUrl(file, contentType, options);
      results.push(result);
      
      console.log(`Successfully uploaded file ${i + 1}/${files.length} to S3 in ${result.region}`);
      
    } catch (error) {
      console.error(`Error uploading file ${i + 1} of ${files.length} (${file.name}) to S3:`, error);
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
  
  console.log(`Batch S3 upload complete: ${successful.length} successful, ${failed.length} failed`);
  
  return results;
};

// Fix: Assign object to a variable before exporting as module default
const s3UploadUtils = { uploadToS3WithPresignedUrl, batchUploadToS3WithPresignedUrl };
export default s3UploadUtils;