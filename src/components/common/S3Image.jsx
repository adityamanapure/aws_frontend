import React from 'react';
import CloudMedia from './CloudMedia';

/**
 * S3Image is a wrapper for CloudMedia that specifically handles images
 */
const S3Image = ({ src, alt, className, placeholder = '/images/placeholder.jpg', ...props }) => {
  return (
    <CloudMedia
      src={src}
      type="image"
      alt={alt}
      className={className}
      placeholder={placeholder}
      {...props}
    />
  );
};

export default S3Image;