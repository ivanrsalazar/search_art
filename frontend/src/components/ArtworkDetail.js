import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/Home.css';  // Reuse Home.css for styling
import LikeButton from './LikeButton';  // Ensure LikeButton is correctly imported
import { AuthContext } from '../AuthContext';  // For user authentication

function ArtworkDetail() {
    const { image_hash } = useParams();
    const navigate = useNavigate();
    const { loggedIn } = useContext(AuthContext);

    const [artwork, setArtwork] = useState(null);
    const [likedArtworks, setLikedArtworks] = useState([]);  // ✅ Defined here

    // ✅ Fetch artwork details
    useEffect(() => {
        const fetchArtwork = async () => {
            try {
                const response = await axios.get(`http://localhost:8001/api/artwork/${image_hash}/`);
                setArtwork(response.data);
            } catch (error) {
                console.error("Error fetching artwork:", error);
            }
        };
        fetchArtwork();
    }, [image_hash]);

    // ✅ Fetch liked artworks
    useEffect(() => {
        const fetchLikedArtworks = async () => {
            if (loggedIn) {
                try {
                    const response = await axios.get(`http://localhost:8001/api/likes/user/`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        }
                    });
                    const likedUrls = response.data.map(like => like.artwork.image_url);
                    setLikedArtworks(likedUrls);
                } catch (err) {
                    console.error('Error fetching liked artworks:', err);
                }
            }
        };

        fetchLikedArtworks();
    }, [loggedIn]);

    // ✅ Like/Unlike functionality
    const toggleLike = (imageUrl) => {
        if (likedArtworks.includes(imageUrl)) {
            axios.delete(`http://localhost:8001/api/likes/${encodeURIComponent(imageUrl)}/`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            }).then(() => {
                setLikedArtworks(prev => prev.filter(url => url !== imageUrl));
            }).catch(err => console.error('Error unliking artwork:', err));
        } else {
            axios.post(`http://localhost:8001/api/likes/`, { image_url: imageUrl }, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            }).then(() => {
                setLikedArtworks(prev => [...prev, imageUrl]);
            }).catch(err => console.error('Error liking artwork:', err));
        }
    };

    const handleBack = () => {
        navigate(-1);  // Go back to the previous page
    };

    const linkHome = () => {
        navigate('/'); // Redirect to home page
    };

    if (!artwork) return <div>Loading...</div>;

    return (
        <div className="artwork-modal">  {/* Reusing modal styling */}
            <div className="artwork-modal-content">
                <div className="artwork-image">
                    <img src={artwork.image_url} alt={artwork.title} className="artwork-image" />
                </div>
                <div className="artwork-details">
                    <h2>{artwork.title}</h2>
                    <div className="detail-item"><strong>Artist:</strong> <br />{artwork.artist}</div>
                    <div className="detail-item"><strong>Date:</strong> <br />{artwork.date}</div>
                    <div className="detail-item"><strong>Dimensions:</strong> <br />{artwork.dimensions}</div>
                    <div className="detail-item"><strong>Medium:</strong> <br />{artwork.medium}</div>
                    <div className="detail-item"><strong>Source:</strong> <br />{artwork.source}</div>

                    <div className='modal-buttons'>
                        {/* ✅ LikeButton now works */}
                        <LikeButton
                            isLiked={likedArtworks.includes(artwork.image_url)}
                            onToggle={() => toggleLike(artwork.image_url)}
                        />
                        <button className="close-button">
                            Share on X
                        </button>
                        <button onClick={linkHome} className="close-button">
                            Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ArtworkDetail;