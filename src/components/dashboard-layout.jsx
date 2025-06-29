'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Bell,
    Heart,
    ShoppingBag,
    User,
    Settings,
    Package,
    Users,
    Plus,
    Menu,
    X,
    Home,
    Tag,
    MessageSquare,
    BarChart3,
    Building2,
    Warehouse
} from 'lucide-react';
import { usePathname } from 'next/navigation';

import api from '../lib/api';
import handleApiError from '../lib/handleApiError';

// API functions
const dashboardAPI = {
    getMe: async () => {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('authToken');
        window.location.href = '/auth/login';
    }
};

// Navigation items
const navigationItems = [
    { name: 'Dashboard', href: '/', icon: Home, current: false },
    {
        name: 'Customers',
        href: '/customers',
        icon: Users,
        current: false
    },
    {
        name: 'Brands',
        href: '/brands',
        icon: Building2,
        current: false
    },
    {
        name: 'Categories',
        href: '/categories',
        icon: Tag,
        current: false
    },
    {
        name: 'Products',
        href: '/products',
        icon: Package,
        current: false
    },
    {
        name: 'Inventories',
        href: '/inventories',
        icon:  Warehouse,
        current: false
    },
    {
        name: 'Orders',
        href: '/orders',
        icon: ShoppingBag,
        current: false
    }
];

export default function DashboardLayout({
    children,
    title = 'Dashboard',
    subtitle = '',
    actions = null,
    currentPath = '/dashboard'
}) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            message: 'New order received',
            time: '2 min ago',
            unread: true
        },
        {
            id: 2,
            message: 'Product review submitted',
            time: '1 hour ago',
            unread: true
        },
        {
            id: 3,
            message: 'Low stock alert',
            time: '3 hours ago',
            unread: false
        }
    ]);
    const pathname = usePathname();

    // Update navigation current state based on current path
    const updatedNavigation = navigationItems.map((item) => ({
        ...item,
        current:
            currentPath === item.href || currentPath.startsWith(item.href + '/')
    }));

    useEffect(() => {
        const checkAuthAndFetchUser = async () => {
            const token = localStorage.getItem('authToken');

            if (!token) {
                window.location.href = '/auth/login';
                return;
            }

            try {
                const userData = await dashboardAPI.getMe();
                setUser(userData.user || userData);
            } catch (error) {
                setError(handleApiError(error) || 'Failed to load user data');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthAndFetchUser();
    }, []);

    const handleLogout = async () => {
        await dashboardAPI.logout();
    };

    const unreadCount = notifications.filter((n) => n.unread).length;

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                        style={{ borderColor: '#E213A7' }}
                    ></div>
                    <div className="text-gray-600">Loading dashboard...</div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Error Loading Dashboard
                    </h1>
                    <p className="text-red-600 mb-6">{error}</p>
                    <div className="space-x-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="text-white font-bold py-2 px-6 rounded-full hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#E213A7' }}
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => (window.location.href = '/login')}
                            className="text-gray-700 font-bold py-2 px-6 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
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
                        className="text-white font-bold py-2 px-6 rounded-full hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#E213A7' }}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 lg:flex">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:transform-none lg:relative ${
                    sidebarOpen
                        ? 'translate-x-0'
                        : '-translate-x-full lg:translate-x-0'
                }`}
            >
                <div
                    className="flex flex-col h-full"
                    style={{ backgroundColor: '#FFE3EC' }}
                >
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-pink-200">
                        <h1 className="text-xl font-bold text-gray-800">
                            Thrifter Babes
                        </h1>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-600 hover:text-gray-800"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {updatedNavigation.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                    item.href === pathname
                                        ? 'bg-pink-200 text-gray-900'
                                        : 'text-gray-700 hover:bg-pink-200 hover:text-gray-900'
                                }`}
                            >
                                <item.icon className="mr-3 h-5 w-5" />
                                {item.name}
                            </a>
                        ))}
                    </nav>

                    {/* Settings */}
                    <div className="px-4 py-4 border-t border-pink-200">
                        <a
                            href="/dashboard/settings"
                            className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-pink-200 hover:text-gray-900 transition-colors"
                        >
                            <Settings className="mr-3 h-5 w-5" />
                            Settings
                        </a>
                    </div>

                    {/* User info */}
                    <div className="p-4 border-t border-pink-200">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                <User size={20} className="text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 truncate">
                                    {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-gray-600 truncate">
                                    @{user.username}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm cursor-pointer"
                            style={{ backgroundColor: '#E213A7' }}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 lg:overflow-y-auto">
                {/* Top bar */}
                <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
                    <div className="flex items-center justify-between h-16 px-6">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden text-gray-600 hover:text-gray-800"
                            >
                                <Menu size={24} />
                            </button>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    {title}
                                </h2>
                                {subtitle && (
                                    <p className="text-sm text-gray-600">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Search */}
                            <div className="relative hidden md:block">
                                <Search
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    size={20}
                                />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                />
                            </div>

                            {/* Notifications */}
                            <div className="relative">
                                <button className="relative p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100">
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span
                                            className="absolute -top-1 -right-1 w-5 h-5 text-xs text-white rounded-full flex items-center justify-center"
                                            style={{
                                                backgroundColor: '#E213A7'
                                            }}
                                        >
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Custom actions */}
                            {actions && (
                                <div className="flex items-center space-x-2">
                                    {actions}
                                </div>
                            )}

                            {/* Add button */}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
