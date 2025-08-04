import React, { useState, useEffect, useRef, useCallback,} from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getCategories } from '../../services/productService';
import { getBestsellers } from '../../services/productService';
import '../../styles/home.css';
import '../../styles/palmonas-theme.css';
import '../../styles/custom-overrides.css'; // Add this line


import HomeProductCard from './HomeProductCard';
import { useHeroSlides } from '../../context/HeroSlideContext';
import { Video, MessageCircle } from 'lucide-react';

// Import hero images for fallback
import hero1 from '../../images/hero-1.webp';
import hero2 from '../../images/hero-2.webp';
import hero3 from '../../images/hero-3.webp';

// Import category images for fallback only
import ringcategory from '../../images/category-rings.webp';
import necklacecategory from '../../images/category-necklaces.webp';
import banglescategory from '../../images/category-bangles.webp';
import earringscategory from '../../images/category-earrings.webp';

// Import product images for fallback
import product1 from '../../images/product-1.jpg';
import product2 from '../../images/product-2.jpg';
import product3 from '../../images/product-3.jpg'; // Fixed - was product-1.jpg
import product4 from '../../images/product-4.jpg'; // Fixed - was product-2.jpg
import placeholderImage from '../../images/placeholder-product.webp';

// Use the working AWS EC2 API endpoint directly
const API_BASE_URL = 'http://ec2-51-20-79-41.eu-north-1.compute.amazonaws.com';
const API_URL = `${API_BASE_URL}/api`;

// Add this function before the Home component definition
const getFallbackImage = (categoryName = '', index = 0) => {
  const name = (categoryName || '').toLowerCase();
  
  if (name.includes('ring')) {
    return ringcategory;
  } else if (name.includes('necklace') || name.includes('pendant')) {
    return necklacecategory;
  } else if (name.includes('bangle') || name.includes('bracelet')) {
    return banglescategory;
  } else if (name.includes('earring')) {
    return earringscategory;
  } else {
    // Default based on index for categories without matching name
    switch(index % 4) {
      case 0: return ringcategory;
      case 1: return necklacecategory;
      case 2: return banglescategory;
      case 3: return earringscategory;
      default: return ringcategory;
    }
  }
};

const Home = () => {
  // State management
  const [activeIndex, setActiveIndex] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bestsellers, setBestsellers] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [currentCategorySlide, setCurrentCategorySlide] = useState(0);
  const [visibleCategories, setVisibleCategories] = useState(4); // Default to 4 items visible
  
  // Get hero slides from context
  const { slides: heroSlides, loading: slidesLoading } = useHeroSlides();
  
  // Auto-slide timer refs
  const timerRef = useRef(null);
  const categoriesAutoplayRef = useRef(null);

  // Fallback hero slider content
  const fallbackHeroSlides = [
    {
      image: hero1,
      buttonLink: "/products",
      alt: "Elegant jewelry display"
    },
    {
      image: hero2,
      buttonLink: "/products?sort=newest",
      alt: "Latest jewelry collection"
    },
    {
      image: hero3,
      buttonLink: "/products?featured=true",
      alt: "Classic jewelry pieces"
    }
  ];

  // Use hero slides from API or fallback if empty
  const displayHeroSlides = heroSlides && heroSlides.length > 0 ? heroSlides : fallbackHeroSlides;

  // Handle auto-rotation for hero slider
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveIndex((current) => (current + 1) % displayHeroSlides.length);
    }, 5000);
    
    return () => clearInterval(timerRef.current);
  }, [displayHeroSlides.length]);
  
  // Fetch bestseller products
  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        console.log('Fetching bestsellers...');
        const result = await getBestsellers();
        console.log('Raw bestseller data:', result);
        
        if (result && result.length > 0) {
          // Format data to match what ProductCard expects
          const bestsellersWithImages = result.slice(0, 6).map(product => {
            // Create images array from image field
            let images = [];
            
            if (product.image) {
              // Handle different image path formats
              let imageUrl = product.image;
              if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = `${API_URL}/${imageUrl}`;
              } else if (imageUrl && imageUrl.startsWith('/')) {
                imageUrl = `${API_URL.split('/api')[0]}${imageUrl}`;
              }
              console.log(`Processed image URL: ${imageUrl} for ${product.title}`);
              images.push(imageUrl);
            } else if (product.images && Array.isArray(product.images) && product.images.length > 0) {
              // If backend already provides an images array
              images = product.images.map(img => {
                if (img && !img.startsWith('http') && !img.startsWith('/')) {
                  return `${API_URL}/${img}`;
                } else if (img && img.startsWith('/')) {
                  return `${API_URL.split('/api')[0]}${img}`;
                }
                return img;
              });
            }
            
            // Only use fallback images if no images were found
            if (images.length === 0) {
              console.log(`No image found for ${product.title}, using fallback`);
              const title = (product.title || '').toLowerCase();
              if (title.includes('ring')) {
                images.push(product1);
              } else if (title.includes('necklace') || title.includes('pendant')) {
                images.push(product2);
              } else if (title.includes('bangle') || title.includes('bracelet')) {
                images.push(product3);
              } else if (title.includes('earring')) {
                images.push(product4);
              } else {
                // Alternate between product images based on ID
                const imageIndex = (product.id % 4);
                switch(imageIndex) {
                  case 0: images.push(product1); break;
                  case 1: images.push(product2); break;
                  case 2: images.push(product3); break;
                  case 3: images.push(product4); break;
                  default: images.push(placeholderImage);
                }
              }
            }
            
            return {
              ...product,
              images: images, 
              category_name: product.category_name || 'Jewelry',
              discount_percentage: product.discount_percentage || 0
            };
          });
          
          console.log('Processed bestsellers:', bestsellersWithImages);
          setBestsellers(bestsellersWithImages);
          
          // Create featured and new arrivals from bestsellers for demo
          setFeaturedProducts(bestsellersWithImages.slice(0, 6));
          setNewArrivals([...bestsellersWithImages].reverse().slice(0, 6));
        } else {
          // Fallback to hardcoded products
          const fallbackProducts = [
            {
              id: 1,
              title: "Elegant Diamond Ring",
              price: 1499,
              images: [product1],
              category_name: "Rings"
            },
            {
              id: 2,
              title: "Pearl Necklace",
              price: 1299,
              images: [product2],
              category_name: "Necklaces",
              discount_percentage: 10
            },
            {
              id: 3,
              title: "Gold Bangle",
              price: 999,
              images: [product3],
              category_name: "Bangles"
            },
            {
              id: 4,
              title: "Crystal Earrings",
              price: 1899,
              images: [product4],
              category_name: "Earrings",
              discount_percentage: 15
            }
          ];
          
          setBestsellers(fallbackProducts);
          setFeaturedProducts(fallbackProducts);
          setNewArrivals(fallbackProducts);
        }
      } catch (error) {
        console.error('Failed to fetch bestsellers:', error);
        // Fallback to hardcoded products
        const fallbackProducts = [
          {
            id: 1,
            title: "Elegant Diamond Ring",
            price: 1499,
            images: [product1],
            category_name: "Rings"
          },
          {
            id: 2,
            title: "Pearl Necklace",
            price: 1299,
            images: [product2],
            category_name: "Necklaces"
          },
          {
            id: 3,
            title: "Gold Bangle",
            price: 999,
            images: [product3],
            category_name: "Bangles"
          },
          {
            id: 4,
            title: "Crystal Earrings",
            price: 1899,
            images: [product4],
            category_name: "Earrings"
          }
        ];
        
        setBestsellers(fallbackProducts);
        setFeaturedProducts(fallbackProducts);
        setNewArrivals(fallbackProducts);
      } finally {
        setProductsLoading(false);
      }
    };
    
    fetchBestsellers();
  }, []);
  
  // Fetch categories - comprehensive implementation
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        console.log('Fetching ALL categories from backend...');
        
        // Use the same function as ProductFeed
        const categoriesData = await getCategories();
        
        if (Array.isArray(categoriesData) && categoriesData.length > 0) {
          console.log(`Received ${categoriesData.length} categories from backend:`, categoriesData);
          
          // Map categories with fallback images
          const processedCategories = categoriesData.map((category, index) => {
            // Determine fallback image based on category name/slug
            let fallbackImage;
            const name = (category.name || '').toLowerCase();
            const slug = (category.slug || '').toLowerCase();
            
            if (name.includes('ring') || slug.includes('ring')) {
              fallbackImage = ringcategory;
            } else if (name.includes('necklace') || slug.includes('necklace')) {
              fallbackImage = necklacecategory;
            } else if (name.includes('bangle') || name.includes('bracelet') || 
                      slug.includes('bangle') || slug.includes('bracelet')) {
              fallbackImage = banglescategory;
            } else if (name.includes('earring') || slug.includes('earring')) {
              fallbackImage = earringscategory;
            } else {
              // Default based on index
              switch(index % 4) {
                case 0: fallbackImage = ringcategory; break;
                case 1: fallbackImage = necklacecategory; break;
                case 2: fallbackImage = banglescategory; break;
                case 3: fallbackImage = earringscategory; break;
                default: fallbackImage = placeholderImage;
              }
            }
            
            return {
              ...category,
              fallbackImage
            };
          });
          
          console.log('Categories processed successfully for home page');
          setCategories(processedCategories);
        } else {
          console.warn('No categories received from backend or invalid format');
          throw new Error('Invalid categories data');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        
        // If API call fails, use fallback categories
        const fallbackCategories = [
          { id: 1, name: 'Rings', slug: 'rings', image: ringcategory, fallbackImage: ringcategory },
          { id: 2, name: 'Necklaces', slug: 'necklaces', image: necklacecategory, fallbackImage: necklacecategory },
          { id: 3, name: 'Bangles', slug: 'bangles', image: banglescategory, fallbackImage: banglescategory },
          { id: 4, name: 'Earrings', slug: 'earrings', image: earringscategory, fallbackImage: earringscategory }
        ];
        
        console.log('Using fallback categories instead');
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  // Calculate visible categories based on screen width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1200) {
        setVisibleCategories(3); // Show 3 on large screens
      } else if (width >= 992) {
        setVisibleCategories(3); // Also 3 on medium-large screens
      } else if (width >= 768) {
        setVisibleCategories(3); // Keep 3 on medium screens
      } else {
        setVisibleCategories(2); // 2 items on small screens
      }
    };
    
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Start category autoplay when categories are loaded
  useEffect(() => {
    if (categories.length > visibleCategories && !loading) {
      startCategoryAutoplay();
    }
    
    return () => {
      if (categoriesAutoplayRef.current) {
        clearInterval(categoriesAutoplayRef.current);
      }
    };
  }, [categories, loading, visibleCategories]);
  
  // Function to start category autoplay
  const startCategoryAutoplay = () => {
    if (categoriesAutoplayRef.current) {
      clearInterval(categoriesAutoplayRef.current);
    }
    
    categoriesAutoplayRef.current = setInterval(() => {
      slideCategoryNext();
    }, 3000);
  };
  
  // Functions to control category sliding
  const slideCategoryPrev = () => {
    setCurrentCategorySlide(prev => {
      if (prev === 0) {
        // Loop to the end
        return Math.max(0, Math.ceil(categories.length / visibleCategories) - 1);
      }
      return prev - 1;
    });
    
    // Reset autoplay timer when manually navigating
    if (categoriesAutoplayRef.current) {
      clearInterval(categoriesAutoplayRef.current);
      startCategoryAutoplay();
    }
  };
  
  const slideCategoryNext = () => {
    setCurrentCategorySlide(prev => {
      const maxSlide = Math.max(0, Math.ceil(categories.length / visibleCategories) - 1);
      if (prev >= maxSlide) {
        // Loop back to the beginning
        return 0;
      }
      return prev + 1;
    });
  };
  
  // Calculate total number of slides
  const getTotalCategorySlides = useCallback(() => {
    if (!categories.length || categories.length <= visibleCategories) {
      return 1;
    }
    return Math.ceil(categories.length / visibleCategories);
  }, [categories.length, visibleCategories]);

  // Group categories into slides for better performance
  const categorySlides = useCallback(() => {
    if (!categories.length) return [];
    
    const slides = [];
    for (let i = 0; i < categories.length; i += visibleCategories) {
      slides.push(categories.slice(i, i + visibleCategories));
    }
    return slides;
  }, [categories, visibleCategories]);

  return (
    <div className="home-container">
      {/* Full-width hero slider */}
      <div className="hero-slider">
        {displayHeroSlides.map((slide, index) => {
          // For debugging
          console.log(`Processing hero slide ${index}:`, slide);
          
          // Determine the correct image source
          let imageSource;
          
          // If it's a string URL from backend
          if (typeof slide.image === 'string') {
            // Check if it's an absolute or relative URL
            if (slide.image.startsWith('http') || slide.image.startsWith('https')) {
              imageSource = slide.image; // Already full URL
            } else if (slide.image.startsWith('/')) {
              // Relative URL from root
              imageSource = `${API_URL.split('/api')[0]}${slide.image}`;
            } else {
              // Relative path that needs API prefix
              imageSource = `${API_URL}/${slide.image}`;
            }
            console.log(`Using API image URL for slide ${index}:`, imageSource);
          } 
          // Use imported images for fallback
          else {
            if (index === 0) {
              imageSource = hero1;
            } else if (index === 1) {
              imageSource = hero2;
            } else if (index === 2) {
              imageSource = hero3;
            } else {
              imageSource = placeholderImage;
            }
            console.log(`Using imported fallback image for slide ${index}`);
          }
          
          return (
            <Link 
              key={index}
              to={slide.buttonLink || "/products"}
              className={`hero-slide ${index === activeIndex ? 'active' : ''}`}
              style={{ backgroundImage: `url(${imageSource})` }}
            >
              {/* Add a hidden image with error handler to detect loading issues */}
              <img 
                src={imageSource}
                alt={slide.alt || `Hero slide ${index + 1}`}
                style={{ display: 'none' }}
                onError={(e) => {
                  console.error(`Failed to load slide ${index} image from: ${imageSource}`);
                  // Try fallback
                  let fallback;
                  if (index === 0) fallback = hero1;
                  else if (index === 1) fallback = hero2;
                  else fallback = hero3;
                  
                  console.log(`Trying fallback for slide ${index}: `, fallback);
                  e.target.parentElement.style.backgroundImage = `url(${fallback})`;
                }}
              />
              <div className="hero-overlay"></div>
            </Link>
          );
        })}
        
        <div className="slider-dots">
          {displayHeroSlides.map((_, index) => (
            <button 
              key={index} 
              className={`slider-dot ${index === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            ></button>
          ))}
        </div>
      </div>
      
      {/* Category Showcase with Circles */}
      <div className="category-showcase">
        <div className="container">
          <h2 className="section-title">Shop By Category</h2>
          
          <div className="category-carousel-container">
            {loading ? (
              <div className="category-slide">
                {Array(visibleCategories).fill(0).map((_, index) => (
                  <div key={index} className="category-item-wrapper">
                    <div className="category-placeholder">
                      <div className="placeholder-image"></div>
                    </div>
                    <div className="category-name-below placeholder-content"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div
                  className="category-carousel-track"
                  style={{
                    transform: `translateX(-${currentCategorySlide * 100}%)`,
                    width: `${getTotalCategorySlides() * 100}%`
                  }}
                >
                  {categorySlides().map((slideCategories, slideIndex) => (
                    <div key={slideIndex} className="category-slide">
                      {slideCategories.map((category, index) => (
                        <div key={category.id || index} className="category-item-wrapper">
                          <Link to={`/products?category=${category.id}`} className="category-card">
                            <div className="category-image">
                              <img 
                                src={category.image || getFallbackImage(category.name, index)}
                                alt={category.name}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getFallbackImage(category.name, index);
                                }}
                              />
                            </div>
                          </Link>
                          <h3 className="category-name-below">{category.name}</h3>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                
                {/* Navigation controls */}
                {getTotalCategorySlides() > 1 && (
                  <>
                    <button
                      className="category-carousel-prev"
                      onClick={slideCategoryPrev}
                      aria-label="Previous categories"
                    >
                      ‹
                    </button>
                    <button
                      className="category-carousel-next"
                      onClick={slideCategoryNext}
                      aria-label="Next categories"
                    >
                      ›
                    </button>
                    
                    <div className="category-carousel-dots">
                      {Array.from({ length: getTotalCategorySlides() }).map((_, index) => (
                        <button
                          key={index}
                          className={`category-carousel-dot ${index === currentCategorySlide ? 'active' : ''}`}
                          onClick={() => setCurrentCategorySlide(index)}
                          aria-label={`Go to category slide ${index + 1}`}
                        ></button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Bestsellers section */}
      <div className="featured-products">
        <div className="container">
          <h2 className="section-title">Bestsellers</h2>
          
          <div className="products-grid">
            {productsLoading ? (
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="product-card product-placeholder">
                  <div className="product-image-placeholder"></div>
                  <div className="product-info">
                    <div className="product-title-placeholder"></div>
                    <div className="product-price-placeholder"></div>
                    <div className="add-to-cart-placeholder"></div>
                  </div>
                </div>
              ))
            ) : (
              bestsellers.slice(0,4).map((product) => (
                <HomeProductCard key={product.id} product={product} />
              ))
            )}
          </div>
          
          <div className="view-all-container">
            <Link to="/products" className="view-all-button">View All Products</Link>
          </div>
        </div>
      </div>
      
      {/* New Arrivals Section */}
      <div className="featured-products new-arrivals">
        <div className="container">
          <h2 className="section-title">New Arrivals</h2>
          
          <div className="products-grid">
            {productsLoading ? (
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="product-card product-placeholder">
                  <div className="product-image-placeholder"></div>
                  <div className="product-info">
                    <div className="product-title-placeholder"></div>
                    <div className="product-price-placeholder"></div>
                    <div className="add-to-cart-placeholder"></div>
                  </div>
                </div>
              ))
            ) : (
              newArrivals.slice(0,4).map((product) => (
                <HomeProductCard key={product.id} product={product} />
              ))
            )}
          </div>
          
          <div className="view-all-container">
            <Link to="/products?sort=newest" className="view-all-button">View All New Arrivals</Link>
          </div>
        </div>
      </div>
      
      
      {/* Featured Collections */}
      <div className="featured-products featured-collections">
        <div className="container">
          <h2 className="section-title">Featured Collections</h2>
          
          <div className="products-grid">
            {productsLoading ? (
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="product-card product-placeholder">
                  <div className="product-image-placeholder"></div>
                  <div className="product-info">
                    <div className="product-title-placeholder"></div>
                    <div className="product-price-placeholder"></div>
                    <div className="add-to-cart-placeholder"></div>
                  </div>
                </div>
              ))
            ) : (
              featuredProducts.slice(0,4).map((product) => (
                <HomeProductCard key={product.id} product={product} />
              ))
            )}
          </div>
          
          <div className="view-all-container">
            <Link to="/products?featured=true" className="view-all-button">View All Featured Products</Link>
          </div>
        </div>
      </div>
      
      {/* Features highlights */}
      <div className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
              </div>
              <h3 className="feature-title">Handcrafted Designs</h3>
              <p className="feature-description">Each piece is carefully made by our skilled artisans</p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 className="feature-title">Quality Materials</h3>
              <p className="feature-description">We use only the finest metals and precious stones</p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3 className="feature-title">Ethical Sourcing</h3>
              <p className="feature-description">Responsibly sourced materials for sustainable luxury</p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
              <h3 className="feature-title">Free Shipping</h3>
              <p className="feature-description">On all orders over ₹999 across India</p>
            </div>
          </div>
        </div>
      </div>
      
      
          
         {/* <!-- Elfsight Instagram Feed | Untitled Instagram Feed --> */}
          {/* <script src="https://static.elfsight.com/platform/platform.js" async></script>
<div class="elfsight-app-7e0d2e81-3e1a-48a6-99d1-98b2628c70ec" data-elfsight-app-lazy></div> */}

          
        
      
     
      
      
      {/* Add the floating action buttons */}
      <div className="floating-actions">
        {/* WhatsApp button now on the left */}
        <a 
          href="https://wa.me/917770089767" 
          target="_blank" 
          rel="noopener noreferrer"
          className="floating-btn whatsapp-btn"
          aria-label="Contact on WhatsApp"
        >
          <MessageCircle size={24} />
          <span>Chat</span>
        </a>
        
        {/* Reels button now on the right with modern styling */}
        <Link to="/reels" className="floating-btn reels-btn" aria-label="View Reels">
          <Video size={24} className="reels-icon" />
          <span>Reels</span>
        </Link>
      </div>
    </div>
  );
};

export default Home;