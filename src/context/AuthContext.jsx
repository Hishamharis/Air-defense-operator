import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const initializeAuth = useCallback(async () => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            api.setToken(token);
            try {
                const data = await api.get('/auth/me');
                setUser(data.user);
            } catch (err) {
                console.error('Failed to initialize auth:', err);
                api.setToken(null);
                setUser(null);
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    const login = async (identifier, password) => {
        try {
            setError(null);
            const data = await api.post('/auth/login', { identifier, password });
            api.setToken(data.accessToken);
            setUser(data.user);
            return true;
        } catch (err) {
            setError(err.message || 'Login failed');
            return false;
        }
    };

    const register = async (username, email, password, confirmPassword) => {
        try {
            setError(null);
            const data = await api.post('/auth/register', { username, email, password, confirmPassword });
            api.setToken(data.accessToken);
            setUser(data.user);
            return true;
        } catch (err) {
            setError(err.message || 'Registration failed');
            return false;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.warn('Logout API call failed, still clearing local state', e);
        } finally {
            api.setToken(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, register, logout, setError }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
