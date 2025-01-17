import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import '../assets/styles/ArtworkDetail.css';

function ArtworkDetail() {
    const navigate = useNavigate();
    const { image_hash } = useParams();  // Extract image_hash from URL
    const location = useLocation();

    const [artwork, setArtwork] = useState(location.state?.artwork || null);
    const [loading, setLoading] = useState(!artwork);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch artwork data only if it isn't passed via location.state
        if (!artwork) {
            const fetchArtwork = async () => {
                try {
                    const response = await fetch(`http://localhost:8000/api/artwork/${image_hash}/`);
                    console.log(image_hash);
                    if (!response.ok) {
                        throw new Error('Artwork not found');
                    }
                    const data = await response.json();
                    setArtwork(data);
                } catch (err) {
                    console.error("Error fetching artwork:", err);
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchArtwork();
        }
    }, [artwork, image_hash]);

    const handleDownload = () => {
        if (artwork?.image_url) {
            const link = document.createElement('a');
            link.href = artwork.image_url;
            link.download = `${artwork.title || 'artwork'}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleBackToResults = () => {
        navigate('/');
    };

    if (loading) return <div>Loading artwork details...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="artwork-detail-container">
            <div className="artwork-image">
                <img src={artwork.image_url} alt={artwork.title} className="artwork-image" />
            </div>
            <div className="artwork-details">
                <h2>{artwork.title}</h2>
                <div className="detail-item"><strong>Artist:</strong> <br />{artwork.artist}</div>
                <div className="detail-item"><strong>Date:</strong> <br />{artwork.date}</div>
                <div className="detail-item"><strong>Dimensions:</strong> <br />{artwork.dimensions}</div>
                <div className="detail-item"><strong>Medium:</strong> <br />{artwork.medium}</div>

                <button onClick={handleDownload} className="download-button">
                    Download Image
                </button>

                <button onClick={handleBackToResults} className="back-button">
                    Back to Results
                </button>
            </div>
        </div>
    );
}

export default ArtworkDetail;