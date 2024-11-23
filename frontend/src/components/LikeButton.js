// src/components/LikeButton.js
import React from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import '../assets/styles/LikeButton.css'; // Ensure this path is correct

function LikeButton({ isLiked, onToggle }) {
    return (
        <button
            className="like-button"
            onClick={onToggle}
            aria-label={isLiked ? 'Unlike' : 'Like'}
        >
            {isLiked ? <FaHeart color="black" /> : <FaRegHeart color="white" />}
        </button>
    );
}

export default LikeButton;