'use client';

import { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import handleApiError from '@/lib/handleApiError';

// API functions for signup
const signupAPI = {
    signup: async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

// Error handling utility
// Error handling utility

export default function SignUpPage() {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const clearField = (field) => {
        setFormData((prev) => ({
            ...prev,
            [field]: ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        // Basic validation
        if (
            !formData.first_name ||
            !formData.last_name ||
            !formData.email ||
            !formData.password
        ) {
            setMessage({ type: 'error', text: 'Please fill in all fields' });
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setMessage({
                type: 'error',
                text: 'Password must be at least 6 characters long'
            });
            setIsLoading(false);
            return;
        }

        try {
            const result = await signupAPI.signup({
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                password: formData.password
            });

            setMessage({
                type: 'success',
                text: 'Account created successfully! Welcome to Thrifter Babes!'
            });

            // Clear form after successful signup
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                confirmPassword: ''
            });

            // Optional: Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '/auth/login';
            }, 2000);
        } catch (error) {
            const apiError = handleApiError(error);
            setMessage({
                type: 'error',
                text:
                    apiError.message ||
                    'Failed to create account. Please try again.'
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
                        Thrifter Babes Sign Up
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
                        {/* First Name */}
                        <div className="flex items-center gap-6">
                            <label
                                htmlFor="first_name"
                                className="text-gray-800 font-semibold text-lg min-w-[140px]"
                            >
                                FIRST NAME:
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative flex-1">
                                <input
                                    id="first_name"
                                    type="text"
                                    placeholder="FIRST NAME"
                                    value={formData.first_name}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'first_name',
                                            e.target.value
                                        )
                                    }
                                    className="w-full bg-white border-0 rounded-full px-6 py-4 text-center placeholder:text-gray-400 text-gray-700 shadow-sm h-12 focus:outline-none focus:ring-2 focus:ring-pink-300"
                                    required
                                />
                            </div>
                        </div>

                        {/* Last Name */}
                        <div className="flex items-center gap-6">
                            <label
                                htmlFor="last_name"
                                className="text-gray-800 font-semibold text-lg min-w-[140px]"
                            >
                                LAST NAME:
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative flex-1">
                                <input
                                    id="last_name"
                                    type="text"
                                    placeholder="LAST NAME"
                                    value={formData.last_name}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'last_name',
                                            e.target.value
                                        )
                                    }
                                    className="w-full bg-white border-0 rounded-full px-6 py-4 text-center placeholder:text-gray-400 text-gray-700 shadow-sm h-12 focus:outline-none focus:ring-2 focus:ring-pink-300"
                                    required
                                />
                                {formData.last_name && (
                                    <button
                                        type="button"
                                        onClick={() => clearField('last_name')}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* User Name */}
                        <div className="flex items-center gap-6">
                            <label
                                htmlFor="email"
                                className="text-gray-800 font-semibold text-lg min-w-[140px]"
                            >
                                EMAIL:
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative flex-1">
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="EMAIL"
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
                                {formData.email && (
                                    <button
                                        type="button"
                                        onClick={() => clearField('email')}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
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

                        {/* Confirm Password */}
                        <div className="flex items-center gap-6">
                            <label
                                htmlFor="confirmPassword"
                                className="text-gray-800 font-semibold text-lg min-w-[180px]"
                            >
                                CONFIRM PASSWORD:
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative flex-1">
                                <input
                                    id="confirmPassword"
                                    type={
                                        showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    placeholder="PASSWORD"
                                    value={formData.confirmPassword}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'confirmPassword',
                                            e.target.value
                                        )
                                    }
                                    className="w-full bg-white border-0 rounded-full px-6 py-4 text-center placeholder:text-gray-400 text-gray-700 shadow-sm h-12 focus:outline-none focus:ring-2 focus:ring-pink-300"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full text-white font-bold py-4 rounded-full text-lg h-14 shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity focus:outline-none focus:ring-2 focus:ring-pink-400"
                                style={{ backgroundColor: '#E213A7' }}
                            >
                                {isLoading ? 'CREATING ACCOUNT...' : 'CONFIRM'}
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
                                    href="/forgot-username"
                                    className="text-gray-700 hover:text-pink-600 underline text-base font-medium transition-colors"
                                >
                                    Forgot Username?
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
