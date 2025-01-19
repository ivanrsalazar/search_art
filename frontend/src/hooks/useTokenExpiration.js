// useTokenExpiration.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const useTokenExpiration = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Assume your token is stored in localStorage and includes an 'exp' (expiration) field.
        const token = localStorage.getItem('authToken');

        if (token) {
            try {
                // For a JWT, you might decode it. (You can use a library like jwt-decode)
                const { exp } = JSON.parse(atob(token.split('.')[1])); // simple JWT decode without verifying signature
                const expirationTime = exp * 1000; // convert to milliseconds
                const currentTime = Date.now();

                if (expirationTime < currentTime) {
                    // Token is expired. Clean up and redirect.
                    localStorage.removeItem('authToken');
                    navigate('/login');
                }
            } catch (error) {
                console.error('Invalid token format', error);
                localStorage.removeItem('authToken');
                navigate('/login');
            }
        }
    }, [navigate]);
};

export default useTokenExpiration;