// src/components/Favorites.js
import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LikeButton from './LikeButton';
import '../assets/styles/Home.css';
import { AuthContext } from '../AuthContext';
import axiosInstance from '../api/axiosInstance';
import ArtworkImage from './ArtworkImage';



function Favorites() {
    const [favorites, setFavorites] = useState([]);
    const [error, setError] = useState(null);
    const [selectedArtwork, setSelectedArtwork] = useState(null);  // For modal display
    const [likedArtworks, setLikedArtworks] = useState([]);         // Track liked artwork URLs
    const [artworks, setArtworks] = useState([]);
    const [isTwitterAuthenticated, setIsTwitterAuthenticated] = useState(false);

    const { loggedIn } = useContext(AuthContext);
    const navigate = useNavigate();

    const removeInvalidArtwork = (invalidUrl) => {
        setArtworks((prevArtworks) =>
            prevArtworks.filter((artwork) => artwork.image_url !== invalidUrl)
        );
    };

    // Fetch user's liked artworks from the API
    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const response = await axiosInstance.get('/likes/user/');
                if (response.data && Array.isArray(response.data)) {
                    const artworks = response.data.map((like) => like.artwork);
                    setFavorites(artworks);
                    setLikedArtworks(artworks.map((artwork) => artwork.image_url));
                }
            } catch (err) {
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    // Let the interceptor handle redirection. No need to set an error.
                    return;
                }
                // For all other errors, show the error message
                console.error('Error fetching favorites:', err);
                setError('Error fetching favorites. Please try again later.');
            }
        };

        if (loggedIn) {
            fetchFavorites();
        }
    }, [loggedIn]);

    // Open the artwork modal for detailed view
    const openArtworkDetailModal = (artwork) => {
        setSelectedArtwork(artwork);
    };

    // Close the modal
    const closeArtworkDetailModal = () => {
        setSelectedArtwork(null);
    };

    // Like/Unlike functionality
    const toggleLike = (imageUrl) => {
        if (likedArtworks.includes(imageUrl)) {
            axiosInstance
                .delete(`/likes/${encodeURIComponent(imageUrl)}/`)
                .then(() => {
                    setLikedArtworks((prev) => prev.filter((url) => url !== imageUrl));
                    setFavorites((prev) => prev.filter((art) => art.image_url !== imageUrl));  // Remove from favorites list
                })
                .catch((err) => {
                    console.error('Error unliking artwork:', err);
                });
        } else {
            axiosInstance
                .post('/likes/', { image_url: imageUrl })
                .then(() => {
                    setLikedArtworks((prev) => [...prev, imageUrl]);
                })
                .catch((err) => {
                    console.error('Error liking artwork:', err);
                });
        }
    };

    // Twitter authentication
    const handleTwitterAuth = async () => {
        try {
            const response = await axiosInstance.get('/twitter/login/');
            // Open Twitter auth in a new window
            window.open(response.data.authorization_url, '_blank', 'width=600,height=400');
        } catch (error) {
            console.error('Error during Twitter login:', error);
            alert('Failed to authenticate with Twitter.');
        }
    };

    // Share artwork on Twitter
    const shareOnTwitter = async (artwork) => {
        if (!isTwitterAuthenticated) {
            alert('You need to authenticate with Twitter to share.');
            await handleTwitterAuth();
            return;
        }

        try {
            const response = await axiosInstance.post('/twitter/post/', {
                title: artwork.title,
                artist: artwork.artist,
                medium: artwork.medium,
                image_url: artwork.image_url,
            });

            if (response.status === 200) {
                alert('Tweet posted successfully!');
            }
        } catch (error) {
            console.error('Error sharing on Twitter:', error);
            alert('Failed to share on Twitter.');
        }
    };

    if (error) {
        return <p className="error">{error}</p>;
    }

    return (
        <div className="home-container">
            {/* Top-right navigation */}
            <div className="top-right-links">
                <Link to="/" className="top-right-link">Home</Link>
            </div>

            <h2>Your Favorites</h2>
            {favorites.length === 0 ? (
                <p>You have no favorites yet. Start liking artworks!</p>
            ) : (
                <div className="artwork-list">
                    {favorites.map((artwork, index) => (
                        <div
                            key={`${artwork.image_url}-${index}`}
                            className="artwork-container"
                            onClick={() => openArtworkDetailModal(artwork)}
                        >
                            <div className="artwork-item">
                                <ArtworkImage artwork={artwork} onInvalidImage={removeInvalidArtwork} />
                                <div className="artwork-title-overlay">
                                    <h3 className="artwork-title">{artwork.title}</h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for artwork details */}
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
                            <div className="detail-item"><strong>Source:</strong> {selectedArtwork.api_source}</div>
                            <div className="modal-buttons">
                                <LikeButton
                                    isLiked={likedArtworks.includes(selectedArtwork.image_url)}
                                    onToggle={() => toggleLike(selectedArtwork.image_url)}
                                />
                                <button onClick={() => shareOnTwitter(selectedArtwork)} className="close-button">
                                    Share on X
                                </button>
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

export default Favorites;