// src/components/Home.js

import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        if (!previousSearch.trim()) {
            setArtworks([]);
            setLoading(false);
            return;
        }

        const fetchArtworks = async () => {
            setLoading(true);
            setError(false);

            try {
                const response = await axios.get(`/api/search/?q=${encodeURIComponent(previousSearch)}`);
                if (response.data && Array.isArray(response.data.images)) {
                    setArtworks(response.data.images.slice(0, 10));
                } else {
                    setArtworks([]);
                }
            } catch (err) {
                setError(true);
                setArtworks([]);
            } finally {
                setLoading(false);
                setShowSearch(false); // Hide search bar when results are displayed
            }
        };

        fetchArtworks();
    }, [previousSearch]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedSearchTerm = searchTerm.trim();
        if (!trimmedSearchTerm) {
            alert('Please enter a search term.');
            return;
        }
        navigate(`/?q=${encodeURIComponent(trimmedSearchTerm)}`);
    };

    const handleBackToSearch = () => {
        setShowSearch(true);
        setArtworks([]);
        setSearchTerm('');
        navigate('/');
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
                <button onClick={handleBackToSearch} className="back-to-search">Back to Search</button>
            )}

            {loading && <div className="spinner"></div>}
            {error && <div className="error">Error loading artworks.</div>}

            {!showSearch && previousSearch && artworks.length === 0 && !loading && !error && (
                <p>No artworks found for "{previousSearch}". Please try a different search term.</p>
            )}

            {artworks.length > 0 && (
                <div className="artwork-list">
                    {artworks.map((artwork) => (
                        <Link
                            key={`${artwork.source}-${artwork.id}`}
                            to={{
                                pathname: `/artwork/${artwork.id}`,
                                search: `?source=${artwork.source}&search=${encodeURIComponent(previousSearch)}`
                            }}
                            state={{ artwork }}  // Pass artwork data here
                            className="artwork-link"
                        >
                            <div className="artwork-item">
                                <img
                                    src={artwork.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
                                    alt={artwork.title}
                                    className="artwork-image"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                                    }}
                                    aria-label={`View details for ${artwork.title}`}
                                />
                                <div className="artwork-title-overlay">
                                    <h3 className="artwork-title">{artwork.title}</h3>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Home;    