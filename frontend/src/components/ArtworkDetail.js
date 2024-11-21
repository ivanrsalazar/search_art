import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../assets/styles/ArtworkDetail.css';

function ArtworkDetail() {
    const navigate = useNavigate();
    const location = useLocation();

    // Access artwork data from React Router's state
    const artwork = location.state?.artwork;
    console.log("Artwork data:", artwork);

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

    // If artwork data is missing, show an error message
    if (!artwork) return <div className="error">Artwork details are missing.</div>;

    const handleBackToResults = () => {
        navigate('/');
    };

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