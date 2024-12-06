import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import LikeButton from './LikeButton';
import '../assets/styles/Home.css';

function Favorites() {
    const [favorites, setFavorites] = useState([]);
    const [error, setError] = useState(null);
    const [selectedArtwork, setSelectedArtwork] = useState(null); // For modal
    const [isTwitterAuthenticated, setIsTwitterAuthenticated] = useState(false); // Twitter auth state

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const url = `http://localhost:8014/api/likes/user/`;
                const response = await axios.get(url, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });

                if (response.data && Array.isArray(response.data)) {
                    const artworks = response.data.map(like => like.artwork);
                    setFavorites(artworks);
                }
            } catch (err) {
                setError('Error fetching favorites.');
                console.error(err);
            }
        };

        fetchFavorites();
    }, []);

    const openArtworkDetailModal = (artwork) => {
        setSelectedArtwork(artwork);
    };

    const closeArtworkDetailModal = () => {
        setSelectedArtwork(null);
    };

    const handleTwitterAuth = async () => {
        try {
            // Redirect to the Twitter login endpoint
            const response = await axios.get('http://localhost:8014/api/twitter/login/');
            window.open(response.data.authorization_url, '_blank', 'width=600,height=400');
        } catch (error) {
            console.error('Error during Twitter login:', error);
            alert('Failed to authenticate with Twitter.');
        }
    };

    const shareOnTwitter = async (artwork) => {
        // Check if the user is authenticated with Twitter
        if (!isTwitterAuthenticated) {
            alert('You need to authenticate with Twitter to share.');
            await handleTwitterAuth();
            return;
        }

        try {
            const response = await axios.post('http://localhost:8014/api/twitter/post/', {
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
            {/* Top-right links */}
            <div className="top-right-links">
                <Link to="/" className="top-right-link">Home</Link>
            </div>

            <h1>Your Favorites</h1>
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
                                <img
                                    src={artwork.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
                                    alt={artwork.title}
                                    className="artwork-image"
                                />
                                <div className="artwork-title-overlay">
                                    <h3 className="artwork-title">{artwork.title}</h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {selectedArtwork && (
                <div className="artwork-modal" onClick={closeArtworkDetailModal}>
                    <div className="artwork-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="artwork-image">
                            <img
                                src={selectedArtwork.image_url}
                                alt={selectedArtwork.title}
                                className="artwork-image"
                            />
                        </div>
                        <div className="artwork-details">
                            <h2>{selectedArtwork.title}</h2>
                            <div className="detail-item"><strong>Artist:</strong> {selectedArtwork.artist}</div>
                            <div className="detail-item"><strong>Date:</strong> {selectedArtwork.date}</div>
                            <div className="detail-item"><strong>Dimensions:</strong> {selectedArtwork.dimensions}</div>
                            <div className="detail-item"><strong>Medium:</strong> {selectedArtwork.medium}</div>
                            <div className="modal-buttons">
                                <button
                                    onClick={() => shareOnTwitter(selectedArtwork)}
                                    className="share-button"
                                >
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