import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useHashNavigation = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if there's a hash in the URL
    if (location.hash) {
      // Remove the # from the hash
      const elementId = location.hash.substring(1);
      
      // Find the element with the matching ID
      const element = document.getElementById(elementId);
      
      if (element) {
        // Small delay to ensure the page has rendered
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      }
    }
  }, [location]);
};

export default useHashNavigation;