// src/components/Home.js

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/Home.css'; // Ensure you have corresponding styles

function Home() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const previousSearch = searchParams.get('q') || '';

    const [artworks, setArtworks] = useState([]); // Initialize as an empty array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Define an async function to fetch artworks
        const fetchArtworks = async () => {
            try {
                // Update the API endpoint to match your Django urls.py
                const response = await axios.get(`/search/?q=${encodeURIComponent(previousSearch)}`);

                // Debugging: Log the entire response
                console.log('Backend response:', response.data);

                // Safeguard: Ensure 'images' exists and is an array
                if (response.data && Array.isArray(response.data.images)) {
                    setArtworks(response.data.images);
                } else {
                    console.warn('Received data without "images" array:', response.data);
                    setArtworks([]); // Set to empty array if 'images' is missing
                }
            } catch (err) {
                console.error('Error fetching artworks:', err);
                setError(true);
                setArtworks([]); // Optional: Reset artworks on error
            } finally {
                setLoading(false);
            }
        };

        // Call the async function
        fetchArtworks();
    }, [previousSearch]);

    if (loading) return <div className="spinner">Loading...</div>;
    if (error) return <div className="error">Error loading artworks.</div>;

    return (
        <div className="home-container">
            <h1>Art Search Results</h1>
            {artworks.length === 0 ? (
                <p>No artworks found for "{previousSearch}"</p>
            ) : (
                <div className="artwork-list">
                    {artworks.map((artwork) => {
                        // Log each image_url before rendering
                        console.log(`Artwork ID ${artwork.id} Image URL:`, artwork.image_url);

                        return (
                            <Link
                                key={`${artwork.source}-${artwork.id}`} // Ensure uniqueness
                                to={`/artwork/${artwork.id}?source=${artwork.source}&search=${encodeURIComponent(previousSearch)}`}
                                className="artwork-link"
                            >
                                <img
                                    src={`${artwork.image_url}`}// Use 'image_url' directly
                                    alt={artwork.title}
                                    className="artwork-image"
                                    onError={(e) => {
                                        e.target.onerror = null; // Prevents infinite loop
                                        e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'; // Placeholder image
                                    }}
                                />
                                <h3 className="artwork-title">{artwork.title}</h3>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Home;