import React, { useState, useEffect } from 'react';

const checkImageUrlByLoading = (url) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => resolve(null);
        img.src = url;
    });
};

const checkImageChain = async (urls) => {
    // Try each URL in order until one works
    for (let url of urls) {
        const valid = await checkImageUrlByLoading(url);
        if (valid) return valid;
    }
    return null;
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
            checkImageChain(fallbackUrls).then(url => {
                if (url) {
                    setValidUrl(url);
                } else {
                    onInvalidImage(artwork.image_url);
                }
            });
        } else if (api_source === 'Artsy') {
            const artsyfallbackSizes = ['normalized', 'larger', 'large', 'medium', 'square'];
            const artsyfallbackUrls = artsyfallbackSizes.map(size =>
                image_url.replace(/[^/]+$/, `${size}.jpg`)
            );
            checkImageChain(artsyfallbackUrls).then(url => {
                if (url) {
                    setValidUrl(url);
                } else {
                    onInvalidImage(artwork.image_url);
                }
            });
        } else {
            setValidUrl(image_url);
        }
    }, [artwork, onInvalidImage]);

    if (!validUrl) return null;

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