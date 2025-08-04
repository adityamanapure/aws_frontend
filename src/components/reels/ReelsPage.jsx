import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Share2, X, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import CloudMedia from '../common/CloudMedia';
import '../../styles/reels.css';

const ReelsPage = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState({});
  const [likedReels, setLikedReels] = useState({});
  const [showProductsDrawer, setShowProductsDrawer] = useState(false);
  const [showProductBadge, setShowProductBadge] = useState({});
  const [sessionId, setSessionId] = useState('');
  
  const reelRefs = useRef({});
  const navigate = useNavigate();
  
  // Initialize session ID for likes
  useEffect(() => {
    let sid = localStorage.getItem('reels_session_id');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('reels_session_id', sid);
    }
    setSessionId(sid);
  }, []);
  
  // Fetch reels from API
  useEffect(() => {
    const fetchReels = async () => {
      try {
        setLoading(true);
        console.log("Fetching reels...");
        const response = await api.get('/api/reels/');
        console.log("API Response:", response);
        
        // Handle paginated response
        let reelsData;
        if (response.data && response.data.results && Array.isArray(response.data.results)) {
          reelsData = response.data.results;
          console.log("Using paginated results:", reelsData);
        } else if (Array.isArray(response.data)) {
          reelsData = response.data;
          console.log("Using direct array results:", reelsData);
        } else {
          console.error("Unexpected data format:", response.data);
          setError('Invalid data format received from server');
          setReels([]);
          return;
        }
        
        setReels(reelsData);
        
        if (reelsData.length === 0) {
          setError('No reels available. Please check back later.');
          return;
        }
        
        // Initialize playing state for all reels
        const initialIsPlaying = {};
        const initialProductBadge = {};
        reelsData.forEach((reel, index) => {
          initialIsPlaying[reel.id] = index === 0; // Only play first reel initially
          initialProductBadge[reel.id] = false; // Product badges hidden initially
        });
        setIsPlaying(initialIsPlaying);
        setShowProductBadge(initialProductBadge);
        
      } catch (err) {
        console.error('Error fetching reels:', err);
        setError('Failed to load reels. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReels();
  }, []);

  // Function to handle reel refs
  const handleReelRef = (id, el) => {
    reelRefs.current[id] = el;
  };
  
  // Function to increment view count
  const incrementViewCount = async (reelId) => {
    try {
      await api.post(`/api/reels/${reelId}/increment_views/`);
    } catch (err) {
      console.error('Error incrementing view count:', err);
    }
  };
  
  // Handle intersecting reels
  useEffect(() => {
    if (reels.length === 0) return;
    
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.8 // 80% of the reel must be visible
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const reelId = entry.target.dataset.reelId;
        
        if (entry.isIntersecting) {
          // Play this reel and pause others
          setIsPlaying(prev => {
            const updated = {};
            Object.keys(prev).forEach(id => {
              updated[id] = id === reelId;
            });
            return updated;
          });
          
          // Update active reel index
          const index = reels.findIndex(reel => reel.id.toString() === reelId);
          if (index !== -1) {
            setActiveReelIndex(index);
            
            // Increment view count
            incrementViewCount(reelId);
          }
        }
      });
    }, options);
    
    // Observe all reel elements
    Object.keys(reelRefs.current).forEach(reelId => {
      const el = reelRefs.current[reelId];
      if (el) {
        observer.observe(el);
      }
    });
    
    return () => {
      observer.disconnect();
    };
  }, [reels]);
  
  // Control video playback when isPlaying changes
  useEffect(() => {
    Object.keys(isPlaying).forEach(reelId => {
      const videoEl = document.getElementById(`video-${reelId}`);
      if (videoEl) {
        if (isPlaying[reelId]) {
          videoEl.play().catch(err => console.error('Error playing video:', err));
        } else {
          videoEl.pause();
        }
      }
    });
  }, [isPlaying]);
  
  const handleToggleLike = async (reelId) => {
    if (!sessionId) return;
    
    try {
      // Explicitly set the Content-Type header to application/json
      await api.post(`/api/reels/${reelId}/toggle_like/`, 
        { session_id: sessionId },
        { 
          headers: { 
            'Content-Type': 'application/json' 
          } 
        }
      );
      
      // Toggle like in state
      setLikedReels(prev => ({
        ...prev,
        [reelId]: !prev[reelId]
      }));
      
      // Update like count in reels state
      setReels(prev =>
        prev.map(reel => {
          if (reel.id === parseInt(reelId)) {
            const delta = likedReels[reelId] ? -1 : 1;
            return {
              ...reel,
              likes_count: (reel.likes_count || 0) + delta
            };
          }
          return reel;
        })
      );
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Share functionality
  const handleShare = async (reel) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: reel.title,
          text: reel.description,
          url: `${window.location.origin}/reels/${reel.id}`
        });
      } else {
        // Fallback for browsers that don't support navigator.share
        const shareUrl = `${window.location.origin}/reels/${reel.id}`;
        navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error('Error sharing reel:', err);
    }
  };
  
  // Toggle product badge visibility
  const toggleProductBadge = (reelId) => {
    setShowProductBadge(prev => ({
      ...prev,
      [reelId]: !prev[reelId]
    }));
  };
  
  // Handle video playing
  useEffect(() => {
    Object.keys(isPlaying).forEach(reelId => {
      const video = document.getElementById(`video-${reelId}`);
      if (video) {
        if (isPlaying[reelId]) {
          video.play().catch(err => console.error('Error playing video:', err));
        } else {
          video.pause();
        }
      }
    });
  }, [isPlaying]);

  // Function to navigate to product page
  const goToProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Define currentReel here to fix the "not defined" errors
  const currentReel = reels.length > 0 ? reels[activeReelIndex] : null;

  // Render the component with improved error handling and debugging
  return (
    <div className="reels-container">
      <div className="reels-header">
        <div className="reels-logo">Fashion Reels</div>
        <button 
          className="reels-close-btn"
          onClick={() => navigate('/')}
        >
          <X size={24} />
        </button>
      </div>
      
      {loading && (
        <div className="reels-loading">
          <div className="loading-spinner"></div>
          <p>Loading reels...</p>
        </div>
      )}
      
      {error && (
        <div className="reels-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      
      {!loading && !error && reels.length === 0 && (
        <div className="reels-empty">
          <p>No reels available.</p>
        </div>
      )}
      
      {!loading && !error && reels.length > 0 && (
        <div className="reels-feed">
          {reels.map((reel, index) => (
            <div
              key={reel.id}
              id={`reel-${reel.id}`}
              className="reel-item"
              data-reel-id={reel.id}
              ref={(el) => handleReelRef(reel.id, el)}
            >
              <div className="reel-video-container">
                <CloudMedia 
                  src={reel.video} 
                  type="video"
                  className="reel-video"
                  controls={false}
                  muted={false} // Change from true to false to enable sound
                  autoPlay={true} 
                  loop={true}
                />
                
                {/* Moved product buttons above the title */}
                {reel.linked_products && reel.linked_products.length > 0 && (
                  <div className="product-buttons-container top-position">
                    {/* Primary shop button - toggles product badges */}
                    <button 
                      className={`shop-toggle-btn ${showProductBadge[reel.id] ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProductBadge(reel.id);
                      }}
                    >
                      <ShoppingBag size={16} />
                      <span>Shop Now</span>
                      <ChevronUp size={14} className="chevron-icon" />
                    </button>
                    
                    {/* Product badges - visible when toggle is active */}
                    {showProductBadge[reel.id] && (
                      <div className="product-badges">
                        {reel.linked_products.map(product => (
                          <button 
                            key={product.id} 
                            className="product-badge"
                            onClick={(e) => {
                              e.stopPropagation(); 
                              goToProduct(product.id);
                            }}
                          >
                            {product.images && product.images[0] && (
                              <img 
                                src={product.images[0]} 
                                alt={product.title} 
                                className="product-badge-image"
                              />
                            )}
                            <div className="product-badge-info">
                              <span className="product-badge-title">{product.title}</span>
                              <span className="product-badge-price">₹{product.price}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Improved reel content layout */}
                <div className="reel-content-container">
                  {/* Content info on the left bottom */}
                  <div className="reel-info-container">
                    <h3 className="reel-title">{reel.title}</h3>
                    <p className="reel-description">{reel.description}</p>
                  </div>
                  
                  {/* Action buttons on the right side */}
                  <div className="reel-actions-container">
                    <button 
                      className={`action-btn like-btn ${likedReels[reel.id] ? 'liked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLike(reel.id);
                      }}
                      aria-label={likedReels[reel.id] ? "Unlike" : "Like"}
                    >
                      <div className="action-btn-icon">
                        <Heart 
                          size={28}
                          fill={likedReels[reel.id] ? "#ff4757" : "none"} 
                          stroke={likedReels[reel.id] ? "#ff4757" : "white"}
                          strokeWidth={2}
                        />
                      </div>
                      <span className="action-btn-text">
                        {(reel.likes_count || 0) + (likedReels[reel.id] ? 1 : 0)}
                      </span>
                    </button>
                    
                    <button 
                      className="action-btn share-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(reel);
                      }}
                      aria-label="Share"
                    >
                      <div className="action-btn-icon">
                        <Share2 size={26} strokeWidth={2} />
                      </div>
                      <span className="action-btn-text">Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      
    </div>
  );
};

export default ReelsPage;