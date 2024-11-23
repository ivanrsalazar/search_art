// src/components/Home.js
import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/Home.css';
import { AuthContext } from '../AuthContext'; // Import AuthContext

// Import LikeButton component
import LikeButton from './LikeButton';

function Home() {
    const { loggedIn, username, logout } = useContext(AuthContext); // Consume AuthContext
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
    const [selectedArtwork, setSelectedArtwork] = useState(null);

    const artworkUrls = useRef(new Set());
    const isFetching = useRef(false);

    // State for Liked Artworks
    const [likedArtworks, setLikedArtworks] = useState(() => {
        // Initialize from localStorage
        const storedLikes = localStorage.getItem('likedArtworks');
        return storedLikes ? JSON.parse(storedLikes) : [];
    });

    // Function to toggle like
    const toggleLike = (imageUrl) => {
        setLikedArtworks((prevLikes) => {
            let updatedLikes;
            if (prevLikes.includes(imageUrl)) {
                // Unlike
                updatedLikes = prevLikes.filter((url) => url !== imageUrl);
            } else {
                // Like
                updatedLikes = [...prevLikes, imageUrl];
            }
            // Update localStorage
            localStorage.setItem('likedArtworks', JSON.stringify(updatedLikes));
            return updatedLikes;
        });
    };

    const fetchArtworks = useCallback(async (offset) => {
        if (isFetching.current || !previousSearch.trim()) return;

        isFetching.current = true;
        setLoading(true);
        setError(false);

        try {
            const url = `http://localhost:8013/api/search/?q=${encodeURIComponent(previousSearch)}&page=${offset}`;
            const response = await axios.get(url);

            if (response.data && Array.isArray(response.data.images)) {
                const newArtworks = response.data.images.filter((artwork) => {
                    if (artworkUrls.current.has(artwork.image_url)) return false;
                    artworkUrls.current.add(artwork.image_url);
                    return true;
                });

                setArtworks((prevArtworks) => [...prevArtworks, ...newArtworks]);

                if (newArtworks.length < 10) {
                    setAllLoaded(true);
                }
            } else {
                setAllLoaded(true);
            }
        } catch (err) {
            setError(true);
            setAllLoaded(true);
        } finally {
            setLoading(false);
            isFetching.current = false;
            setShowSearch(false);
        }
    }, [previousSearch]);

    useEffect(() => {
        if (!previousSearch.trim()) {
            setArtworks([]);
            setLoading(false);
            return;
        }

        const previousStoredSearch = sessionStorage.getItem('previousSearch');
        if (previousStoredSearch !== previousSearch) {
            sessionStorage.removeItem('searchResults');
            sessionStorage.setItem('previousSearch', previousSearch);
            setArtworks([]);
            setPageOffset(1);
            setAllLoaded(false);
            fetchArtworks(1);
        } else {
            const storedArtworks = sessionStorage.getItem('searchResults');
            if (storedArtworks) {
                setArtworks(JSON.parse(storedArtworks));
                setShowSearch(false);
                setLoading(false);
            } else {
                fetchArtworks(1);
            }
        }
    }, [previousSearch, fetchArtworks]);

    const handleLoadMore = () => {
        const newPageOffset = pageOffset + 1;
        setPageOffset(newPageOffset);
        fetchArtworks(newPageOffset);
    };

    const openArtworkDetailModal = (artwork) => {
        setSelectedArtwork(artwork);
    };

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
            <div className="top-right-links">
                {loggedIn ? (
                    <>
                        <span className="username-display">Hello, {username}!</span>
                        <button onClick={logout} className="logout-button">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="top-right-link">Login</Link>
                        <Link to="/register" className="top-right-link">Register</Link>
                    </>
                )}
            </div>

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
                        <div key={`${artwork.image_url}-${index}`} className="artwork-container">
                            <div className="artwork-item" onClick={() => openArtworkDetailModal(artwork)}>
                                <img
                                    src={artwork.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
                                    alt={artwork.title}
                                    className="artwork-image"
                                    loading="lazy"
                                    aria-label={`View details for ${artwork.title}`}
                                />
                                <div className="artwork-title-overlay">
                                    <h3 className="artwork-title">{artwork.title}</h3>
                                    {/* Like Button */}
                                    <LikeButton
                                        isLiked={likedArtworks.includes(artwork.image_url)}
                                        onToggle={() => toggleLike(artwork.image_url)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!allLoaded && !loading && (
                <button onClick={handleLoadMore} className="load-more-button">
                    Load More
                </button>
            )}

            {selectedArtwork && (
                <div className="artwork-modal" onClick={closeArtworkDetailModal}>
                    <div className="artwork-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="artwork-image">
                            <img src={selectedArtwork.image_url} alt={selectedArtwork.title} className="artwork-image" />
                        </div>
                        <div className="artwork-details">
                            <h2>{selectedArtwork.title}</h2>
                            <div className="detail-item"><strong>Artist:</strong> <br />{selectedArtwork.artist}</div>
                            <div className="detail-item"><strong>Date:</strong> <br />{selectedArtwork.date}</div>
                            <div className="detail-item"><strong>Dimensions:</strong> <br />{selectedArtwork.dimensions}</div>
                            <div className="detail-item"><strong>Medium:</strong> <br />{selectedArtwork.medium}</div>

                            {/* Like Button in Modal */}
                            <LikeButton
                                isLiked={likedArtworks.includes(selectedArtwork.image_url)}
                                onToggle={() => toggleLike(selectedArtwork.image_url)}
                            />

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