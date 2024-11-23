// src/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext({
    loggedIn: false,
    username: null,
    login: () => { },
    logout: () => { },
});

export const AuthProvider = ({ children }) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [username, setUsername] = useState(null);

    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const storedUsername = localStorage.getItem('username');
        if (accessToken && storedUsername) {
            setLoggedIn(true);
            setUsername(storedUsername);
        }
    }, []);

    const login = (username) => {
        setLoggedIn(true);
        setUsername(username);
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        setLoggedIn(false);
        setUsername(null);
    };

    return (
        <AuthContext.Provider value={{ loggedIn, username, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};