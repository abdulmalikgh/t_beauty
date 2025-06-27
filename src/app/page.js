'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '@/lib/api';

// API instance for this component
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// API functions for dashboard
const dashboardAPI = {
    logout: async () => {
        try {
            await api.post('/auth/logout');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
        } catch (error) {
            // Even if logout fails, remove token locally
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            throw error;
        }
    }
};

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get user data from localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        setIsLoading(false);
    }, []);

    const handleLogout = async () => {
        try {
            await dashboardAPI.logout();
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if API call fails
            window.location.href = '/login';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Access Denied
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Please log in to access the dashboard.
                    </p>
                    <button
                        onClick={() => (window.location.href = '/login')}
                        className="text-white font-bold py-2 px-6 rounded-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-pink-400"
                        style={{ backgroundColor: '#E213A7' }}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div
                className="min-h-screen p-8"
                style={{ backgroundColor: '#FFE3EC' }}
            >
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">
                                    Welcome back, {user.firstName}! 👋
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    Ready to find some amazing thrift deals?
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-white font-bold py-2 px-6 rounded-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-pink-400"
                                style={{ backgroundColor: '#E213A7' }}
                            >
                                Logout
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-pink-50 p-6 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Profile
                                </h3>
                                <p className="text-gray-600">
                                    {user.firstName} {user.lastName}
                                </p>
                                <p className="text-gray-600">
                                    @{user.username}
                                </p>
                            </div>

                            <div className="bg-pink-50 p-6 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Recent Activity
                                </h3>
                                <p className="text-gray-600">
                                    No recent activity
                                </p>
                            </div>

                            <div className="bg-pink-50 p-6 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Quick Actions
                                </h3>
                                <div className="space-y-2">
                                    <button className="w-full text-sm bg-transparent border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300">
                                        Browse Items
                                    </button>
                                    <button className="w-full text-sm bg-transparent border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300">
                                        My Favorites
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
