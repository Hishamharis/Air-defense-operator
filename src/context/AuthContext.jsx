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
                const mockUser = { id: 1, username: 'COMMANDER', email: 'cmd@local' };
                setUser(mockUser);
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
            const mockUser = { id: 'local_' + Date.now(), username: identifier, role: 'USER' };
            api.setToken('mock_token_123');
            setUser(mockUser);
            return true;
        } catch (err) {
            setError(err.message || 'Login failed');
            return false;
        }
    };

    const register = async (username, email, password, confirmPassword) => {
        try {
            setError(null);
            const mockUser = { id: 'local_' + Date.now(), username, role: 'USER' };
            api.setToken('mock_token_123');
            setUser(mockUser);
            return true;
        } catch (err) {
            setError(err.message || 'Registration failed');
            return false;
        }
    };

    const logout = async () => {
        try {
            // mock logout
            console.log("Mock logout");
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
