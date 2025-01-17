import React, { useState, useEffect } from 'react';

const checkImageUrl = async (url, fallbackUrls) => {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
            return url;
        } else if (fallbackUrls.length > 0) {
            return await checkImageUrl(fallbackUrls[0], fallbackUrls.slice(1));
        } else {
            throw new Error('No valid image URL found');
        }
    } catch (error) {
        console.error(`Error loading image: ${url}`, error);
        return null;  // Return null if all attempts fail
    }
};

function ArtworkImage({ artwork, onInvalidImage }) {
    const [validUrl, setValidUrl] = useState('');

    useEffect(() => {
        const { image_url, api_source } = artwork;

        if (api_source === 'Art Institute of Chicago') {
            const fallbackSizes = ['1686', '843', '600', '400', '200'];
            const fallbackUrls = fallbackSizes.map(size =>
                image_url.replace(/full\/.*?\/0/, `full/${size},/0`)
            );

            checkImageUrl(fallbackUrls[0], fallbackUrls.slice(1)).then(url => {
                if (url) {
                    setValidUrl(url);
                } else {
                    onInvalidImage(artwork.image_url);  // Notify parent to remove invalid image
                }
            });
        } else {
            setValidUrl(image_url);
        }
    }, [artwork, onInvalidImage]);

    if (!validUrl) return null;  // Don't render anything if URL is invalid

    return (
        <img
            src={validUrl}
            alt={artwork.title}
            className="artwork-image"
            loading="lazy"
            onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Unavailable';
            }}
        />
    );
}

export default ArtworkImage;