// File: src/components/product/ProductFeed.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from './ProductCard';
import { getProducts, getCategories } from '../../services/productService';
import '../../styles/productFeed.css';

export default function ProductFeed() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [currentVisibleProduct, setCurrentVisibleProduct] = useState(0);
  const observer = useRef();
  const isInitialMount = useRef(true);
  const isFirstLoad = useRef(true);
  const fetchingRef = useRef(false);
  const totalItemsRef = useRef(0);
  const itemsPerPage = 12;
  const feedContainerRef = useRef(null);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryId = queryParams.get('category');

  useEffect(() => {
    // If category is provided, fetch products from that category
    if (categoryId) {
      setSelectedCategory(categoryId);
      setPage(1);
    } else {
      setSelectedCategory('all');
      setPage(1);
    }
  }, [categoryId]);

  // Set status message based on loading state and product count
  useEffect(() => {
    if (loading) {
      setStatusMessage('Loading more products...');
    } else if (!hasMore && products.length > 0) {
      setStatusMessage('You have reached the end');
    } else if (products.length === 0 && !loading) {
      setStatusMessage('No products found for this category');
    } else {
      setStatusMessage('');
    }
  }, [loading, hasMore, products.length]);

  // Observer for infinite scrolling with improved controls
  const lastProductElementRef = useCallback(node => {
    if (loading || !hasMore || fetchingRef.current) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading && !fetchingRef.current) {
        if (totalItemsRef.current > 0 && products.length >= totalItemsRef.current) {
          console.log('All products already loaded, stopping API calls');
          setHasMore(false);
          setStatusMessage('You have reached the end');
          return;
        }

        const lastPageItemCount = products.length % itemsPerPage;
        if (lastPageItemCount > 0 && lastPageItemCount < itemsPerPage && page > 1) {
          console.log('Last page was not full, stopping API calls');
          setHasMore(false);
          setStatusMessage('You have reached the end');
          return;
        }

        console.log('Last product in view, triggering next page load');
        setFetchTrigger(prev => prev + 1);
      }
    }, { threshold: 0.5 });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, products.length, page]);

  // Handle fetch trigger changes - this consolidates API calls
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (fetchingRef.current) return;

    if (totalItemsRef.current > 0 && products.length >= totalItemsRef.current) {
      console.log('All products already fetched, not updating page');
      setHasMore(false);
      setStatusMessage('You have reached the end');
      return;
    }

    console.log('Fetch trigger incremented, updating page');
    setPage(prev => prev + 1);
  }, [fetchTrigger, products.length]);

  // Initial effect to fetch first page of products + categories
  useEffect(() => {
    if (isFirstLoad.current) {
      console.log('Initial component load - fetching categories and first page');

      const loadInitialData = async () => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        try {
          setLoading(true);
          setStatusMessage('Loading products...');

          const categoriesData = await getCategories();
          if (Array.isArray(categoriesData)) {
            setCategories(categoriesData);
            console.log('Categories loaded successfully');
          } else {
            console.error('Expected array of categories but got:', categoriesData);
            setCategories([]);
          }

          const response = await getProducts(1, null);

          if (response && response.total !== undefined) {
            totalItemsRef.current = response.total;
            console.log(`Server reported ${response.total} total products`);
          }

          const productsData = response && response.results ? response.results : response;

          if (productsData && productsData.length > 0) {
            setProducts(productsData);
            console.log('First page of products loaded successfully');

            if (response.total && productsData.length >= response.total) {
              console.log('All products loaded on first page');
              setHasMore(false);
              setStatusMessage('You have reached the end');
            } else if (productsData.length < itemsPerPage) {
              console.log('First page returned fewer items than expected, marking as end');
              setHasMore(false);
              setStatusMessage('You have reached the end');
            }
          } else {
            setHasMore(false);
            setStatusMessage('No products found');
            console.log('No products returned from API on initial load');
          }
        } catch (error) {
          console.error('Error during initial data load:', error);
          setStatusMessage('Error loading products');
        } finally {
          setLoading(false);
          isFirstLoad.current = false;
          fetchingRef.current = false;
        }
      };

      loadInitialData();
      return;
    }
  }, []);

  // Fetch products when page changes (only for page > 1 since initial load handles page 1)
  useEffect(() => {
    if (isFirstLoad.current || page === 1) return;

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    let isMounted = true;
    console.log(`Page changed to ${page}, fetching more products...`);

    const fetchMoreProducts = async () => {
      setLoading(true);

      try {
        console.log(`Fetching products: page=${page}, category=${selectedCategory}`);
        const response = await getProducts(page, selectedCategory !== 'all' ? selectedCategory : null);

        if (!isMounted) return;

        if (response && response.total !== undefined) {
          totalItemsRef.current = response.total;
          console.log(`Server reported ${response.total} total products`);
        }

        const newProducts = response && response.results ? response.results : response;

        if (!newProducts || newProducts.length === 0) {
          console.log('No more products available');
          setHasMore(false);
          setStatusMessage('You have reached the end');
        } else {
          const updatedTotalProducts = products.length + newProducts.length;
          setProducts(prev => [...prev, ...newProducts]);
          console.log(`Added ${newProducts.length} more products to the list`);

          if (totalItemsRef.current > 0 && updatedTotalProducts >= totalItemsRef.current) {
            console.log('All products have been loaded');
            setHasMore(false);
            setStatusMessage('You have reached the end');
          } else if (newProducts.length < itemsPerPage) {
            console.log('Page returned fewer items than expected, marking as end');
            setHasMore(false);
            setStatusMessage('You have reached the end');
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching more products:', error);
          setStatusMessage('Error loading more products');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          fetchingRef.current = false;
        }
      }
    };

    fetchMoreProducts();

    return () => {
      isMounted = false;
    };
  }, [page, selectedCategory]);

  // Handle category changes with a separate effect
  useEffect(() => {
    if (isFirstLoad.current) return;

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    let isMounted = true;
    console.log(`Category changed to: ${selectedCategory}, resetting and fetching products`);

    const fetchCategoryProducts = async () => {
      setLoading(true);
      setStatusMessage('Loading category products...');

      try {
        setHasMore(true);
        totalItemsRef.current = 0;

        console.log(`Fetching products for category: ${selectedCategory}`);
        const response = await getProducts(1, selectedCategory !== 'all' ? selectedCategory : null);

        if (!isMounted) return;

        if (response && response.total !== undefined) {
          totalItemsRef.current = response.total;
          console.log(`Server reported ${response.total} total products for category`);
        }

        const categoryProducts = response && response.results ? response.results : response;

        if (!categoryProducts || categoryProducts.length === 0) {
          console.log('No products available for this category');
          setProducts([]);
          setHasMore(false);
          setStatusMessage('No products found in this category');
        } else {
          setProducts(categoryProducts);
          console.log(`Loaded ${categoryProducts.length} products for category`);

          if (totalItemsRef.current > 0 && categoryProducts.length >= totalItemsRef.current) {
            console.log('All category products loaded on first page');
            setHasMore(false);
            setStatusMessage('You have reached the end');
          } else if (categoryProducts.length < itemsPerPage) {
            console.log('Category has fewer products than page size, marking as end');
            setHasMore(false);
            setStatusMessage('You have reached the end');
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching category products:', error);
          setProducts([]);
          setStatusMessage('Error loading category products');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          fetchingRef.current = false;
        }
      }
    };

    fetchCategoryProducts();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  // Track the currently visible product
  useEffect(() => {
    if (!feedContainerRef.current || products.length === 0) return;

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.7 // Consider visible when 70% in view
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Extract the index from the data attribute
          const index = parseInt(entry.target.dataset.index, 10);
          setCurrentVisibleProduct(index);
        }
      });
    }, options);

    // Get all product items
    const productItems = document.querySelectorAll('.full-screen-product-item');
    productItems.forEach(item => {
      observer.observe(item);
    });

    return () => {
      observer.disconnect();
    };
  }, [products.length]);

  // Handle category change
  const handleCategoryChange = useCallback((category) => {
    if (category === selectedCategory) return;

    console.log(`User selected category: ${category}`);
    setSelectedCategory(category);
    setPage(1);
  }, [selectedCategory]);

  return (
    <div className="feed-layout-container">
      {/* Main content with products */}
      <div className="main-products-area">
        {/* Product feed */}
        {loading && products.length === 0 ? (
          <div className="full-screen-loader">
            <div className="loader-spinner"></div>
            <p>Loading amazing products...</p>
          </div>
        ) : products.length === 0 && !loading ? (
          <div className="no-products-screen">
            <h2>No products found</h2>
            <p>Try selecting a different category</p>
          </div>
        ) : (
          <div 
            className="full-screen-product-grid"
            ref={feedContainerRef}
          >
            {products.map((product, index) => {
              if (products.length === index + 1) {
                return (
                  <div 
                    ref={lastProductElementRef} 
                    key={product.id || index} 
                    className="full-screen-product-item"
                    data-index={index}
                  >
                    <ProductCard product={product} />
                  </div>
                );
              } else {
                return (
                  <div 
                    key={product.id || index} 
                    className="full-screen-product-item"
                    data-index={index}
                  >
                    <ProductCard product={product} />
                  </div>
                );
              }
            })}

            {/* Position indicator */}
            {products.length > 0 && (
              <div className="product-position-indicator">
                {currentVisibleProduct + 1} / {products.length}
              </div>
            )}
          </div>
        )}
        
        {/* Loading indicator or end message at bottom */}
        {loading && products.length > 0 ? (
          <div className="bottom-loading-indicator">
            <div className="loading-spinner"></div>
          </div>
        ) : (!loading && !hasMore && products.length > 0) ? (
          <div className="end-of-feed-message">
            <p>{statusMessage}</p>
          </div>
        ) : null}
      </div>
      
      {/* Categories navigation sidebar - moved to the right */}
      <div className="category-sidebar">
        <div className="category-sidebar-header">
          <h3>Categories</h3>
        </div>
        
        <div className="category-list">
          <button 
            className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('all')}
          >
            All Products
          </button>
          
          {Array.isArray(categories) && categories.map((category, index) => (
            <button
              key={category.id || index}
              className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}