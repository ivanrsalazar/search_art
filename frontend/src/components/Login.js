import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../assets/styles/Login.css';
import { AuthContext } from '../AuthContext'; // Import AuthContext

function Login() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext); // Consume AuthContext

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await fetch('http://localhost:8000/api/login/', { // Ensure this URL is correct
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Login response:', data);
                localStorage.setItem('accessToken', data.access); // Save access token
                localStorage.setItem('refreshToken', data.refresh); // Save refresh token
                localStorage.setItem('username', formData.username); // Save username

                login(formData.username); // Update AuthContext

                navigate('/'); // Redirect to home
            } else {
                const data = await response.json();
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        }
    };

    return (
        <div className="login-container">
            <h1>Login</h1>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter your username..."
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password..."
                        required
                    />
                </div>
                <button type="submit">Log in</button>
            </form>
            <div className="form-link">
                <p>
                    Don't have an account? <Link to="/register">Register here.</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;