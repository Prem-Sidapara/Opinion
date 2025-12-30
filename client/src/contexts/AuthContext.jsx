import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                } catch (err) {
                    console.error('Invalid token', err);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        setError(null);
        try {
            const res = await api.post('/auth/login', { email, password });
            const { token, ...userData } = res.data;
            localStorage.setItem('token', token);
            setUser(userData);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            return false;
        }
    };

    const register = async (email, password, username) => {
        setError(null);
        try {
            const res = await api.post('/auth/register', { email, password, username });
            const { token, ...userData } = res.data;
            localStorage.setItem('token', token);
            setUser(userData);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const googleLogin = async (token) => {
        setError(null);
        try {
            const res = await api.post('/auth/google', { token });
            const { token: jwtToken, ...userData } = res.data;
            localStorage.setItem('token', jwtToken);
            setUser(userData);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Google Login failed');
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, register, logout, googleLogin }}>
            {children}
        </AuthContext.Provider>
    );
};
