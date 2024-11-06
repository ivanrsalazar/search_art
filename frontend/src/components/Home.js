// frontend/src/components/Home.js

import React, { useState } from 'react';
import axios from 'axios';
import '../assets/styles/Home.css';

function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [results, setResults] = useState([]);
    const [searched, setSearched] = useState(false); // New state to track if a search has been done

    const searchArtworks = () => {
        if (!searchTerm) {
            alert("Please enter a search term.");
            return;
        }

        setLoading(true);
        setError(false);
        setResults([]);
        setSearched(true); // Mark that a search has been made

        axios
            .get(`/api/search/`, { params: { q: searchTerm } })
            .then((response) => {
                setLoading(false);
                setResults(response.data.images || []);
            })
            .catch((error) => {
                console.error('Error fetching artworks:', error);
                setError(true);
                setLoading(false);
            });
    };

    return (
        <div className="home-container">
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

            {loading && <div id="loading-spinner">Loading...</div>}
            {error && <p className="center-message">An error occurred while fetching artworks.</p>}

            <div id="results">
                {results.length > 0 ? (
                    results.map((item) => (
                        <div key={item.id}>
                            <h4>
                                <a href={`/artwork/${item.id}/`}>{item.title}</a>
                            </h4>
                            <a href={`/artwork/${item.id}/`}>
                                <img src={`data:image/jpeg;base64,${item.image}`} alt={item.title} />
                            </a>
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