// src/components/Home.js
import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';  // Using axiosInstance for API calls
import '../assets/styles/Home.css';
import { AuthContext } from '../AuthContext';

import LikeButton from './LikeButton';
import ArtworkImage from './ArtworkImage';

function Home() {
    const { loggedIn, username, logout } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const initialSearch = searchParams.get('q') || '';

    const [inputValue, setInputValue] = useState(initialSearch);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [showSearch, setShowSearch] = useState(initialSearch.trim() === '');
    const [pageOffset, setPageOffset] = useState(1);
    const [allLoaded, setAllLoaded] = useState(false);
    const [selectedArtwork, setSelectedArtwork] = useState(null);

    const artworkUrls = useRef(new Set());
    const isFetching = useRef(false);

    const [likedArtworks, setLikedArtworks] = useState([]);

    const removeInvalidArtwork = (invalidUrl) => {
        setArtworks((prevArtworks) =>
            prevArtworks.filter((artwork) => artwork.image_url !== invalidUrl)
        );
    };

    const toggleLike = (imageUrl) => {
        if (!loggedIn) {
            navigate('/login');
            return;
        }

        if (likedArtworks.includes(imageUrl)) {
            axiosInstance.delete(`/likes/${encodeURIComponent(imageUrl)}/`)
                .then(() => {
                    setLikedArtworks((prevLikes) =>
                        prevLikes.filter((url) => url !== imageUrl)
                    );
                })
                .catch(err => {
                    console.error('Error unliking artwork:', err);
                });
        } else {
            axiosInstance.post(`/likes/`, { image_url: imageUrl })
                .then(() => {
                    setLikedArtworks((prevLikes) => [...prevLikes, imageUrl]);
                })
                .catch(err => {
                    console.error('Error liking artwork:', err);
                });
        }
    };

    const fetchArtworks = useCallback(async (offset) => {
        if (isFetching.current || !searchTerm.trim()) return;

        isFetching.current = true;
        setLoading(true);
        setError(false);

        try {
            const response = await axiosInstance.get(`/search/?q=${encodeURIComponent(searchTerm)}&page=${offset}`);
            console.log('Search response:', response.data); // Debug log
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
    }, [searchTerm]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setArtworks([]);
            setLoading(false);
            setShowSearch(true);
            setPageOffset(1);
            setAllLoaded(false);
            return;
        }
        setArtworks([]);
        setPageOffset(1);
        setAllLoaded(false);
        fetchArtworks(1);
    }, [searchTerm, fetchArtworks]);

    useEffect(() => {
        const fetchLikedArtworks = async () => {
            try {
                const response = await axiosInstance.get(`/likes/user/`);
                if (response.data && Array.isArray(response.data)) {
                    const likedUrls = response.data.map(like => like.artwork.image_url);
                    setLikedArtworks(likedUrls);
                }
            } catch (err) {
                console.error('Error fetching liked artworks:', err);
            }
        };

        if (loggedIn) {
            fetchLikedArtworks();
        } else {
            setLikedArtworks([]);
        }
    }, [loggedIn]);

    const handleLoadMore = () => {
        const newPageOffset = pageOffset + 1;
        setPageOffset(newPageOffset);
        fetchArtworks(newPageOffset);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedSearchTerm = inputValue.trim();
        if (!trimmedSearchTerm) {
            alert('Please enter a search term.');
            return;
        }
        setSearchTerm(trimmedSearchTerm);
        navigate(`/?q=${encodeURIComponent(trimmedSearchTerm)}`);
    };

    const handleBackToSearch = () => {
        navigate('/');
        setInputValue('');
        setSearchTerm('');
        setArtworks([]);
        setPageOffset(1);
        setAllLoaded(false);
        setShowSearch(true);
        artworkUrls.current = new Set();
    };

    // Modal close handler
    const closeArtworkDetailModal = () => {
        setSelectedArtwork(null);
    };

    return (
        <div className="home-container">
            <div className="top-right-links">
                {loggedIn ? (
                    <div className="dropdown">
                        <span className="username-display">Hello, {username}!</span>
                        <div className="dropdown-content">
                            <Link to="/favorites" className="dropdown-link">Favorites</Link>
                            <button onClick={logout} className="dropdown-link">Logout</button>
                        </div>
                    </div>
                ) : (
                    <div className="auth-links">
                        <Link to="/login" className="top-right-link">Login</Link>
                        <Link to="/register" className="top-right-link">Register</Link>
                    </div>
                )}
            </div>

            {showSearch && <h1>Art Search</h1>}
            {showSearch ? (
                <form onSubmit={handleSubmit} className="search-form">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Search for artworks..."
                        className="search-input"
                    />
                    <button type="submit" className="search-button">Search</button>
                </form>
            ) : (
                <button onClick={handleBackToSearch} className="back-to-search">Back to Search</button>
            )}

            {loading && <div className="spinner"></div>}
            {error && <div className="error">Error loading artworks.</div>}

            {artworks.length > 0 && (
                <div className="artwork-list">
                    {artworks.map((artwork, index) => (
                        <div key={`${artwork.image_url}-${index}`} className="artwork-container">
                            <div className="artwork-item" onClick={() => setSelectedArtwork(artwork)}>
                                <ArtworkImage artwork={artwork} onInvalidImage={removeInvalidArtwork} />
                                <div className="artwork-title-overlay">
                                    <h3 className="artwork-title">{artwork.title}</h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!allLoaded && !loading && (
                <button onClick={handleLoadMore} className="load-more-button">Load More</button>
            )}

            {/* Modal rendering block */}
            {selectedArtwork && (
                <div className="artwork-modal" onClick={closeArtworkDetailModal}>
                    <div className="artwork-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="artwork-image">
                            <ArtworkImage artwork={selectedArtwork} onInvalidImage={removeInvalidArtwork} />
                        </div>
                        <div className="artwork-details">
                            <h2>{selectedArtwork.title}</h2>
                            <div className="detail-item"><strong>Artist:</strong> {selectedArtwork.artist}</div>
                            <div className="detail-item"><strong>Date:</strong> {selectedArtwork.date}</div>
                            <div className="detail-item"><strong>Dimensions:</strong> {selectedArtwork.dimensions}</div>
                            <div className="detail-item"><strong>Medium:</strong> {selectedArtwork.medium}</div>
                            <div className="modal-buttons">
                                <LikeButton
                                    isLiked={likedArtworks.includes(selectedArtwork.image_url)}
                                    onToggle={() => toggleLike(selectedArtwork.image_url)}
                                />
                                <button onClick={closeArtworkDetailModal} className="close-button">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Home;