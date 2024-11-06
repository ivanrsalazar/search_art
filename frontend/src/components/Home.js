// frontend/src/components/Home.js

import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../assets/styles/Home.css';

function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [results, setResults] = useState([]);
    const [searched, setSearched] = useState(false);

    const searchArtworks = () => {
        if (!searchTerm) {
            alert("Please enter a search term.");
            return;
        }

        setLoading(true);
        setError(false);
        setResults([]);
        setSearched(true);

        axios
            .get(`/api/search/`, { params: { q: searchTerm } })
            .then((response) => {
                setLoading(false);
                setResults(response.data.images.slice(0, 10)); // Limit to 10 images for 2x5 grid
            })
            .catch((error) => {
                console.error('Error fetching artworks:', error);
                setError(true);
                setLoading(false);
            });
    };

    return (
        <div className="home-container">
            {!results.length > 0 && (
                <div className="search-bar-container">
                    <h1>Search for Artworks</h1>
                    <input
                        type="text"
                        id="search-input"
                        placeholder="Enter search term"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button onClick={searchArtworks}>Search</button>
                </div>
            )}

            {loading && <div className="spinner"></div>}
            {error && <p className="center-message">An error occurred while fetching artworks.</p>}

            <div id="results">
                {results.length > 0 ? (
                    results.map((item) => (
                        <div key={item.id} className="image-container">
                            <Link to={`/artwork/${item.id}?search=${searchTerm}`}>
                                <img src={`data:image/jpeg;base64,${item.image}`} alt={item.title} />
                                <div className="image-title">{item.title}</div>
                            </Link>
                        </div>
                    ))
                ) : (
                    searched && !loading && !error && (
                        <p className="center-message">No images found.</p>
                    )
                )}
            </div>
        </div>
    );
}

export default Home;