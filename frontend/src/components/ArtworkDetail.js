// frontend/src/components/ArtworkDetail.js

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/ArtworkDetail.css';

function ArtworkDetail() {
    const { id } = useParams();
    const [artwork, setArtwork] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        axios
            .get(`/api/artwork/${id}/`)
            .then((response) => {
                setArtwork(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching artwork details:', error);
                setError(true);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div className="spinner"></div>;
    if (error || !artwork) return <div>Error loading artwork details.</div>;

    const formatDimensions = (dimensions) => {
        if (!dimensions) return 'N/A';
        const firstPart = dimensions.split(';')[0].trim();
        const openParenIndex = firstPart.indexOf('(');
        if (openParenIndex === -1) {
            return <span>{firstPart}</span>;
        }
        const metric = firstPart.substring(0, openParenIndex).trim();
        const imperial = firstPart.substring(openParenIndex).trim();

        return (
            <span>
                {metric}
                <br />
                {imperial}
            </span>
        );
    };

    const formatDetail = (label, value) => {
        return (
            <div className="detail-item">
                <strong>{label}:</strong>
                <br />
                <span>{value || 'N/A'}</span>
            </div>
        );
    };

    return (
        <div className="artwork-detail-container">
            <div className="artwork-image">
                <img src={`data:image/jpeg;base64,${artwork.image}`} alt={artwork.title} />
            </div>
            <div className="artwork-details">
                <h2>{artwork.title}</h2>
                {formatDetail('Artist', artwork.artist)}
                {formatDetail('Date', artwork.date)}
                {formatDetail('Dimensions', formatDimensions(artwork.dimensions))}
                {formatDetail('Medium', artwork.medium)}

                <a
                    href={`data:image/jpeg;base64,${artwork.image}`}
                    download={`${artwork.title || 'artwork'}.jpg`}
                    className="download-button"
                >
                    Download Image
                </a>

                <Link to="/" className="back-link">Back to Search</Link>
            </div>
        </div>
    );
}

export default ArtworkDetail;