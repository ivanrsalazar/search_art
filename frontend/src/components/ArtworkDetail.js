// src/components/ArtworkDetail.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/ArtworkDetail.css';

function ArtworkDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const previousSearch = searchParams.get('search') || '';
    const source = searchParams.get('source') || 'aic';

    const [artwork, setArtwork] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [actualSize, setActualSize] = useState('');
    const [downloadSize, setDownloadSize] = useState('');
    const [downloadUrl, setDownloadUrl] = useState('');
    const [downloadOptions, setDownloadOptions] = useState([]);

    useEffect(() => {
        axios.get(`/api/artwork/${id}/`, { params: { source } })
            .then(response => {
                setArtwork(response.data);
                setLoading(false);
                if (source === 'aic') {
                    fetchDisplayedImage(response.data.image_id, '1686,');
                }
            })
            .catch(error => {
                console.error('Error fetching artwork details:', error);
                setError(true);
                setLoading(false);
            });
    }, [id, source]);

    const fetchDisplayedImage = (image_id, size) => {
        axios.get(`/api/get_image/`, { params: { image_id, size } })
            .then(response => {
                const { img_base64, actual_size } = response.data;
                setActualSize(actual_size);
                const [width, height] = actual_size.split('x').map(Number);
                const aspectRatio = width / height;

                // Generate download options
                const sizes = ['1686,', '843,', '600,', '400,', '200,'];
                const availableSizes = sizes.filter((s) => parseInt(s) <= width);

                const newDownloadOptions = availableSizes.map((s) => {
                    const w = parseInt(s);
                    let h = w / aspectRatio;

                    // Custom rounding logic
                    if (h % 1 >= 0.25) {
                        h = Math.ceil(h); // Round up if the decimal portion is >= 0.25
                    } else {
                        h = Math.floor(h); // Round down otherwise
                    }

                    return { sizeParam: s, displayLabel: `${w}x${h}` };
                });

                setDownloadOptions(newDownloadOptions);
                setDownloadSize(newDownloadOptions[0].sizeParam);
                setDownloadUrl(`https://www.artic.edu/iiif/2/${image_id}/full/${newDownloadOptions[0].sizeParam}/0/default.jpg`);
            })
            .catch(error => console.error('Error fetching displayed image:', error));
    };

    const handleDownloadSizeChange = (event) => {
        const selectedSize = event.target.value;
        setDownloadSize(selectedSize);
        setDownloadUrl(`https://www.artic.edu/iiif/2/${artwork.image_id}/full/${selectedSize}/0/default.jpg`);
    };

    const handleDownload = async () => {
        if (artwork.source === 'aic') {
            try {
                const response = await axios.get(downloadUrl, {
                    responseType: 'blob',
                });

                const blobUrl = URL.createObjectURL(response.data);
                const link = document.createElement('a');

                // Find the selected download option to get the width and height
                const currentOption = downloadOptions.find(option => option.sizeParam === downloadSize);
                const dimensions = currentOption.displayLabel; // e.g., "600x400"

                link.href = blobUrl;
                link.download = `${artwork.title || 'artwork'}_${dimensions}.jpg`; // Include dimensions in the filename
                document.body.appendChild(link);
                link.click();
                URL.revokeObjectURL(blobUrl);
                document.body.removeChild(link);
            } catch (error) {
                console.error('Error downloading the image:', error);
            }
        } else if (artwork.source === 'harvard') {
            alert("Downloading images from Harvard Art Museums is subject to their terms of use and is currently disabled.");
            // Alternatively, implement Harvard-specific download logic if permitted
        }
    };

    if (loading) return <div className="spinner">Loading...</div>;
    if (error || !artwork) return <div className="error">Error loading artwork details.</div>;

    // Determine image source based on the artwork's source
    const imageSource = artwork.source === 'harvard' ? artwork.image : `data:image/jpeg;base64,${artwork.image}`;

    return (
        <div className="artwork-detail-container">
            <div className="artwork-image">
                <img src={imageSource} alt={artwork.title} className="artwork-image" />
                {artwork.source === 'aic' && <p className="image-size">Image Size: {actualSize}</p>}
                {artwork.source === 'harvard' && (
                    <p className="image-size">
                        Image provided by Harvard Art Museums.{' '}
                        <a href={`https://www.harvardartmuseums.org/collections/object/${artwork.image_id}`} target="_blank" rel="noopener noreferrer">
                            View on Harvard Art Museums
                        </a>
                    </p>
                )}
            </div>
            <div className="artwork-details">
                <h2>{artwork.title}</h2>
                <div className="detail-item"><strong>Artist:</strong> <br />{artwork.artist}</div>
                <div className="detail-item"><strong>Date:</strong> <br />{artwork.date}</div>
                <div className="detail-item"><strong>Dimensions:</strong> <br />{artwork.dimensions}</div>
                <div className="detail-item"><strong>Medium:</strong> <br />{artwork.medium}</div>

                {artwork.source === 'aic' && (
                    <>
                        <div className="download-options">
                            <label htmlFor="size-select">Download Size:</label>
                            <select id="size-select" value={downloadSize} onChange={handleDownloadSizeChange}>
                                {downloadOptions.map((option) => (
                                    <option key={option.sizeParam} value={option.sizeParam}>
                                        {option.displayLabel}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button onClick={handleDownload} className="download-button">
                            Download Image
                        </button>
                    </>
                )}

                {artwork.source === 'harvard' && (
                    <p>
                        Images from Harvard Art Museums are subject to their{' '}
                        <a href="https://www.harvardartmuseums.org/terms-of-use" target="_blank" rel="noopener noreferrer">
                            Terms of Use
                        </a>.
                    </p>
                )}

                <button onClick={() => navigate(-1)} className="back-button">
                    Back to Search
                </button>

                {previousSearch && (
                    <button onClick={() => navigate(`/?q=${encodeURIComponent(previousSearch)}`)} className="back-to-images-button">
                        Back to Images
                    </button>
                )}
            </div>
        </div>
    );
}

export default ArtworkDetail;