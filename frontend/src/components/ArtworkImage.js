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
    for (let url of urls) {
        const valid = await checkImageUrlByLoading(url);
        if (valid) return valid;
    }
    return null;
};

function ArtworkImage({ artwork, onInvalidImage }) {
    const [validUrl, setValidUrl] = useState(null);  // Changed from '' to null

    useEffect(() => {
        let isMounted = true;  // To prevent state updates on unmounted components

        const { image_url, api_source } = artwork;

        const loadImage = async () => {
            let urlToUse = image_url;

            if (api_source === 'Art Institute of Chicago') {
                const fallbackSizes = ['1686', '843', '600', '400', '200'];
                const fallbackUrls = fallbackSizes.map(size =>
                    image_url.replace(/full\/.*?\/0/, `full/${size},/0`)
                );

                urlToUse = await checkImageChain(fallbackUrls);
            } else if (api_source === 'Artsy') {
                const artsyFallbackSizes = ['normalized', 'larger', 'large', 'medium', 'square'];
                const artsyFallbackUrls = artsyFallbackSizes.map(size =>
                    image_url.replace(/[^/]+$/, `${size}.jpg`)
                );

                urlToUse = await checkImageChain(artsyFallbackUrls);
            }

            if (isMounted) {
                if (urlToUse) {
                    setValidUrl(urlToUse);
                } else {
                    onInvalidImage(image_url);  // Notify parent component if all URLs fail
                }
            }
        };

        loadImage();

        return () => {
            isMounted = false;  // Cleanup to prevent memory leaks
        };
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