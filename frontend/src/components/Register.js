import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../assets/styles/Register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            const payload = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
            };

            const response = await axios.post('/api/register/', payload);
            setMessage(
                response.data.message ||
                'User created successfully! Please check your email for verification instructions.'
            );
            setError('');
            setFormData({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
            });
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Something went wrong!';
            setError(errorMsg);
            setMessage('');
        }
    };

    return (
        <div className="register-page">
            {/* Top-right Home link */}
            <div className="top-right-link-container">
                <Link to="/" className="top-right-link">
                    Home
                </Link>
            </div>

            <div className="register-container">
                <h1>Register your account</h1>
                {error && <p className="error-message">{error}</p>}
                {message && <p className="success-message">{message}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password:</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit">Register</button>
                </form>
                <div className="form-link">
                    <p>
                        Already have an account? <Link to="/login">Sign in.</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;