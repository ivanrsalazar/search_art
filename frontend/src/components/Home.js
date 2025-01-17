// src/components/Home.js
import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/Home.css';
import { AuthContext } from '../AuthContext'; // Import AuthContext

// Import LikeButton component
import LikeButton from './LikeButton';
import ArtworkImage from './ArtworkImage';

function Home() {
    const { loggedIn, username, logout } = useContext(AuthContext); // Consume AuthContext
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const initialSearch = searchParams.get('q') || '';

    // Introduce a separate state for the input value
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

    // State for Liked Artworks
    const [likedArtworks, setLikedArtworks] = useState([]);

    const removeInvalidArtwork = (invalidUrl) => {
        setArtworks((prevArtworks) =>
            prevArtworks.filter((artwork) => artwork.image_url !== invalidUrl)
        );
    };

    const toggleLike = (imageUrl) => {
        console.log('Before Toggle:', likedArtworks); // Log current state

        if (likedArtworks.includes(imageUrl)) {
            const url = `http://localhost:8000/api/likes/${encodeURIComponent(imageUrl)}/`;
            axios.delete(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            })
                .then(() => {
                    setLikedArtworks((prevLikes) => {
                        const updatedLikes = prevLikes.filter((url) => url !== imageUrl);
                        console.log('After Unlike:', updatedLikes); // Log updated state
                        return updatedLikes;
                    });
                })
                .catch(err => {
                    console.error('Error unliking artwork:', err);
                });
        } else {
            const url = `http://localhost:8000/api/likes/`;
            console.log('Sending Authorization:', localStorage.getItem('accessToken'));
            axios.post(url, { image_url: imageUrl }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            })
                .then(() => {
                    setLikedArtworks((prevLikes) => {
                        const updatedLikes = [...prevLikes, imageUrl];
                        console.log('After Like:', updatedLikes); // Log updated state
                        return updatedLikes;
                    });
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
            const url = `http://localhost:8000/api/search/?q=${encodeURIComponent(searchTerm)}&page=${offset}`;
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
    }, [searchTerm]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setArtworks([]);
            setLoading(false);
            setShowSearch(true); // Show the search bar
            setPageOffset(1);
            setAllLoaded(false);
            return;
        }

        // Reset artworks and pagination when searchTerm changes
        setArtworks([]);
        setPageOffset(1);
        setAllLoaded(false);
        fetchArtworks(1);
    }, [searchTerm, fetchArtworks]);

    // New useEffect to fetch liked artworks when logged in
    useEffect(() => {
        const fetchLikedArtworks = async () => {
            try {
                const url = `http://localhost:8000/api/likes/user/`;
                const response = await axios.get(url, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });

                if (response.data && Array.isArray(response.data)) {
                    // Extract image URLs from the liked artworks
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
            setLikedArtworks([]); // Clear liked artworks when logged out
        }
    }, [loggedIn]);

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
        const trimmedSearchTerm = inputValue.trim();
        if (!trimmedSearchTerm) {
            alert('Please enter a search term.');
            return;
        }

        // Update the searchTerm state to trigger useEffect
        setSearchTerm(trimmedSearchTerm);

        // Update the URL query parameter
        navigate(`/?q=${encodeURIComponent(trimmedSearchTerm)}`);
    };

    // **Handler to reset the state when "Back to Search" is clicked**
    const handleBackToSearch = () => {
        navigate('/');
        setInputValue('');      // Clear the input field
        setSearchTerm('');     // Clear the search term to trigger useEffect
        setArtworks([]);       // Clear artworks
        setPageOffset(1);      // Reset pagination
        setAllLoaded(false);   // Reset allLoaded flag
        setShowSearch(true);   // Show the search bar
        artworkUrls.current = new Set(); // **Reset the artwork URLs**
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
            {!showSearch && searchTerm && artworks.length === 0 && !loading && !error && (
                <p>No artworks found for "{searchTerm}". Please try a different search term.</p>
            )}

            {artworks.length > 0 && (
                <div className="artwork-list">
                    {artworks.map((artwork, index) => (
                        <div key={`${artwork.image_url}-${index}`} className="artwork-container">
                            <div className="artwork-item" onClick={() => openArtworkDetailModal(artwork)}>
                                <ArtworkImage
                                    artwork={artwork}
                                    onInvalidImage={removeInvalidArtwork}
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
                            <ArtworkImage artwork={selectedArtwork} />
                        </div>
                        <div className="artwork-details">
                            <h2>{selectedArtwork.title}</h2>
                            <div className="detail-item"><strong>Artist:</strong> <br />{selectedArtwork.artist}</div>
                            <div className="detail-item"><strong>Date:</strong> <br />{selectedArtwork.date}</div>
                            <div className="detail-item"><strong>Dimensions:</strong> <br />{selectedArtwork.dimensions}</div>
                            <div className="detail-item"><strong>Medium:</strong> <br />{selectedArtwork.medium}</div>
                            <div className="detail-item"><strong>Source:</strong> <br />{selectedArtwork.api_source}</div>

                            <div className='modal-buttons'>
                                {/* Like Button in Modal */}
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