import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = (userData, token) => {
        sessionStorage.setItem('studentToken', token);
        setUser(userData);
    };

    const logout = () => {
        sessionStorage.removeItem('studentToken');
        setUser(null);
    };

    const checkAuth = async () => {
        const token = sessionStorage.getItem('studentToken');
        if (token) {
            try {
                const response = await axios.get(`${config.BASE_URL}/student/profile/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(response.data);
            } catch (error) {
                console.error('Auth check failed:', error);
                sessionStorage.removeItem('studentToken');
                setUser(null);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
