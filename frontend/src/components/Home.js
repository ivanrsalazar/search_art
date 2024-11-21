import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/Home.css';

function Home() {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const previousSearch = searchParams.get('q') || '';

    const [searchTerm, setSearchTerm] = useState(previousSearch);
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [showSearch, setShowSearch] = useState(true);
    const [pageOffset, setPageOffset] = useState(1);
    const [allLoaded, setAllLoaded] = useState(false);
    const [selectedArtwork, setSelectedArtwork] = useState(null); // State for selected artwork to display in modal

    const artworkUrls = useRef(new Set()); // Use ref to keep track of unique URLs
    const isFetching = useRef(false); // Prevent multiple requests at once

    // Fetch artworks with API and page offset
    const fetchArtworks = useCallback(async (offset) => {
        if (isFetching.current || !previousSearch.trim()) {
            return; // Prevent request if it's already fetching or search term is empty
        }

        isFetching.current = true; // Set fetching flag to true
        setLoading(true);
        setError(false);

        try {
            const url = `http://localhost:8013/api/search/?q=${encodeURIComponent(previousSearch)}&page=${offset}`;
            console.log("Fetching URL:", url);  // Log the URL being requested
            const response = await axios.get(url);

            if (response.data && Array.isArray(response.data.images)) {
                const newArtworks = response.data.images.filter((artwork) => {
                    if (artworkUrls.current.has(artwork.image_url)) return false;
                    artworkUrls.current.add(artwork.image_url);
                    return true;
                });

                // Append new images to existing artworks
                setArtworks((prevArtworks) => [...prevArtworks, ...newArtworks]);

                // Check if there are no more images to load
                if (newArtworks.length < 10) {
                    setAllLoaded(true);
                }
            } else {
                setAllLoaded(true);
            }
        } catch (err) {
            console.error("Error making API call:", err);
            setError(true);
            setAllLoaded(true);
        } finally {
            setLoading(false);
            isFetching.current = false; // Reset fetching flag after the request completes
            setShowSearch(false);
        }
    }, [previousSearch]);

    // Handle search term changes and initial fetch
    useEffect(() => {
        console.log("Previous Search Term:", previousSearch);

        if (!previousSearch.trim()) {
            setArtworks([]);
            setLoading(false);
            return;
        }

        // Reset if search term changes
        const previousStoredSearch = sessionStorage.getItem('previousSearch');
        if (previousStoredSearch !== previousSearch) {
            sessionStorage.removeItem('searchResults');
            sessionStorage.setItem('previousSearch', previousSearch);
            setArtworks([]);
            setPageOffset(1);
            setAllLoaded(false);
            fetchArtworks(1);  // Fetch first page of results when search term changes
        } else {
            // Load from session storage if available
            const storedArtworks = sessionStorage.getItem('searchResults');
            if (storedArtworks) {
                setArtworks(JSON.parse(storedArtworks));
                setShowSearch(false);
                setLoading(false);
            } else {
                fetchArtworks(1);  // Fetch first page of results if no stored data
            }
        }
    }, [previousSearch, fetchArtworks]);

    // Function to handle "Load More" button click
    const handleLoadMore = () => {
        const newPageOffset = pageOffset + 1;
        setPageOffset(newPageOffset);
        fetchArtworks(newPageOffset);
    };

    // Open artwork details in modal
    const openArtworkDetailModal = (artwork) => {
        setSelectedArtwork(artwork);
    };

    // Close artwork details modal
    const closeArtworkDetailModal = () => {
        setSelectedArtwork(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedSearchTerm = searchTerm.trim();
        if (!trimmedSearchTerm) {
            alert('Please enter a search term.');
            return;
        }

        sessionStorage.removeItem('searchResults');
        sessionStorage.setItem('previousSearch', trimmedSearchTerm);

        navigate(`/?q=${encodeURIComponent(trimmedSearchTerm)}`);
    };

    return (
        <div className="home-container">
            {showSearch && <h1>Art Search</h1>}
            {showSearch ? (
                <form onSubmit={handleSubmit} className="search-form">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for artworks..."
                        className="search-input"
                    />
                    <button type="submit" className="search-button">Search</button>
                </form>
            ) : (
                <button onClick={() => navigate('/')} className="back-to-search">Back to Search</button>
            )}

            {loading && <div className="spinner"></div>}
            {error && <div className="error">Error loading artworks.</div>}
            {!showSearch && previousSearch && artworks.length === 0 && !loading && !error && (
                <p>No artworks found for "{previousSearch}". Please try a different search term.</p>
            )}

            {artworks.length > 0 && (
                <div className="artwork-list">
                    {artworks.map((artwork, index) => (
                        <div key={`${artwork.image_url}-${index}`} onClick={() => openArtworkDetailModal(artwork)}>
                            <div className="artwork-item">
                                <img
                                    src={artwork.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
                                    alt={artwork.title}
                                    className="artwork-image"
                                    loading="lazy"
                                    aria-label={`View details for ${artwork.title}`}
                                />
                                <div className="artwork-title-overlay">
                                    <h3 className="artwork-title">{artwork.title}</h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* "Load More" button */}
            {!allLoaded && !loading && (
                <button onClick={handleLoadMore} className="load-more-button">
                    Load More
                </button>
            )}

            {/* Modal to show artwork details */}
            {selectedArtwork && (
                <div className="artwork-modal">
                    <div className="artwork-modal-content">
                        <div className="artwork-image">
                            <img src={selectedArtwork.image_url} alt={selectedArtwork.title} className="artwork-image" />
                        </div>
                        <div className="artwork-details">
                            <h2>{selectedArtwork.title}</h2>
                            <div className="detail-item"><strong>Artist:</strong> <br />{selectedArtwork.artist}</div>
                            <div className="detail-item"><strong>Date:</strong> <br />{selectedArtwork.date}</div>
                            <div className="detail-item"><strong>Dimensions:</strong> <br />{selectedArtwork.dimensions}</div>
                            <div className="detail-item"><strong>Medium:</strong> <br />{selectedArtwork.medium}</div>

                            <button onClick={() => {
                                const link = document.createElement('a');
                                link.href = selectedArtwork.image_url;
                                link.download = `${selectedArtwork.title || 'artwork'}.jpg`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }} className="download-button">
                                Download Image
                            </button>

                            <button onClick={closeArtworkDetailModal} className="close-button">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;