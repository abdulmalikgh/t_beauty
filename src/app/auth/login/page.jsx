'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import handleApiError from '@/lib/handleApiError';

const loginAPI = {
    login: async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);

            // Store token if login successful
            if (response.data.token) {
                localStorage.setItem('authToken', response.data.access_token);
            }

            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [rememberMe, setRememberMe] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        // Basic validation
        if (!formData.email || !formData.password) {
            setMessage({ type: 'error', text: 'Please fill in all fields' });
            setIsLoading(false);
            return;
        }

        try {
            const result = await loginAPI.login({
                email: formData.email,
                password: formData.password,
                rememberMe: rememberMe
            });

            setMessage({
                type: 'success',
                text: 'Login successful! Welcome back to Thrifter Babes!'
            });

            // Clear form after successful login
            setFormData({
                email: '',
                password: ''
            });

            // Redirect to dashboard after 1.5 seconds
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } catch (error) {
            const apiError = handleApiError(error);
            setMessage({
                type: 'error',
                text:
                    apiError.message ||
                    'Invalid email or password. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Main Content with Exact Pink Background */}
            <div
                className="min-h-screen flex items-center justify-center p-4"
                style={{ backgroundColor: '#FFE3EC' }}
            >
                <div className="w-full max-w-md">
                    <h1 className="text-3xl font-bold text-center text-gray-800 mb-12">
                        Thrifter Babes Login
                    </h1>

                    {/* Success/Error Message */}
                    {message.text && (
                        <div
                            className={`mb-6 p-4 rounded-lg text-center font-medium ${
                                message.type === 'success'
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* email */}
                        <div className="flex items-center gap-6">
                            <label
                                htmlFor="email"
                                className="text-gray-800 font-semibold text-lg min-w-[140px]"
                            >
                                USER NAME:
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative flex-1">
                                <input
                                    id="email"
                                    type="text"
                                    placeholder="USER NAME"
                                    value={formData.email}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'email',
                                            e.target.value
                                        )
                                    }
                                    className="w-full bg-white border-0 rounded-full px-6 py-4 text-center placeholder:text-gray-400 text-gray-700 shadow-sm h-12 focus:outline-none focus:ring-2 focus:ring-pink-300"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="flex items-center gap-6">
                            <label
                                htmlFor="password"
                                className="text-gray-800 font-semibold text-lg min-w-[140px]"
                            >
                                PASSWORD:
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative flex-1">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="PASSWORD"
                                    value={formData.password}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'password',
                                            e.target.value
                                        )
                                    }
                                    className="w-full bg-white border-0 rounded-full px-6 py-4 text-center placeholder:text-gray-400 text-gray-700 shadow-sm h-12 focus:outline-none focus:ring-2 focus:ring-pink-300"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="flex items-center justify-center gap-3">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) =>
                                    setRememberMe(e.target.checked)
                                }
                                className="w-4 h-4 text-pink-600 bg-white border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                            />
                            <label
                                htmlFor="rememberMe"
                                className="text-gray-700 font-medium"
                            >
                                Remember Me
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full text-white font-bold py-4 rounded-full text-lg h-14 shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity focus:outline-none focus:ring-2 focus:ring-pink-400"
                                style={{ backgroundColor: '#E213A7' }}
                            >
                                {isLoading ? 'SIGNING IN...' : 'LOGIN'}
                            </button>
                        </div>

                        {/* Links */}
                        <div className="text-center space-y-3 pt-6">
                            <div>
                                <Link
                                    href="/forgot-password"
                                    className="text-gray-700 hover:text-pink-600 underline text-base font-medium transition-colors"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                            <div>
                                <Link
                                    href="/forgot-email"
                                    className="text-gray-700 hover:text-pink-600 underline text-base font-medium transition-colors"
                                >
                                    Forgot email?
                                </Link>
                            </div>
                            <div className="pt-4">
                                <span className="text-gray-600">
                                    {"Don't have an account? "}
                                </span>
                                <Link
                                    href="/auth/signup"
                                    className="text-pink-600 hover:text-pink-700 underline font-medium transition-colors"
                                >
                                    Sign Up Here
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
