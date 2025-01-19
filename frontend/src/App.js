// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './components/Home';
import ArtworkDetail from './components/ArtworkDetail';
import Register from './components/Register';
import Login from './components/Login';
import Favorites from './components/Favorites';
import ProtectedRoute from './components/ProtectedRoute';
import './assets/styles/App.css';
import axiosInstance from './api/axiosInstance';

// Axios interceptor component
function AxiosInterceptor() {
  const navigate = useNavigate();

  useEffect(() => {
    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Clear the stored tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('username');

          // Force a redirect to the login page.
          // Using window.location.href forces a hard redirect.
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <AxiosInterceptor />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/artwork/:image_hash" element={<ArtworkDetail />} />
        <Route path="/register/" element={<Register />} />
        <Route path="/login/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;