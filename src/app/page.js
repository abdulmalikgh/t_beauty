'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import {
    TrendingUp,
    Package,
    Heart,
    ShoppingBag,
    Star,
    Grid,
    List,
    Filter,
    Plus
} from 'lucide-react';

// Mock data for dashboard
const mockStats = [
    { label: 'Total Items', value: '1,234', icon: Package, change: '+12%' },
    { label: 'Favorites', value: '89', icon: Heart, change: '+5%' },
    { label: 'Orders', value: '156', icon: ShoppingBag, change: '+23%' },
    { label: 'Reviews', value: '4.8', icon: Star, change: '+0.2' }
];

const mockRecentItems = [
    {
        id: 1,
        name: 'Vintage Denim Jacket',
        price: '$45',
        image: '/placeholder.svg?height=80&width=80',
        category: 'Jackets',
        status: 'Available'
    },
    {
        id: 2,
        name: 'Designer Handbag',
        price: '$120',
        image: '/placeholder.svg?height=80&width=80',
        category: 'Bags',
        status: 'Sold'
    },
    {
        id: 3,
        name: 'Retro Sunglasses',
        price: '$25',
        image: '/placeholder.svg?height=80&width=80',
        category: 'Accessories',
        status: 'Available'
    },
    {
        id: 4,
        name: 'Vintage Band T-Shirt',
        price: '$30',
        image: '/placeholder.svg?height=80&width=80',
        category: 'Clothing',
        status: 'Available'
    },
    {
        id: 5,
        name: 'Classic Leather Boots',
        price: '$85',
        image: '/placeholder.svg?height=80&width=80',
        category: 'Shoes',
        status: 'Available'
    },
    {
        id: 6,
        name: 'Silk Scarf',
        price: '$35',
        image: '/placeholder.svg?height=80&width=80',
        category: 'Accessories',
        status: 'Sold'
    }
];

const mockNotifications = [
    { id: 1, message: 'New item added to your favorites', time: '2 hours ago' },
    {
        id: 2,
        message: "Your item 'Vintage Dress' has been sold!",
        time: '1 day ago'
    },
    {
        id: 3,
        message: "Price drop on items you're watching",
        time: '2 days ago'
    },
    { id: 4, message: 'New customer registered', time: '4 hours ago' },
    { id: 5, message: 'Monthly report is ready', time: '1 day ago' }
];

export default function DashboardPage() {
    const [viewMode, setViewMode] = useState('grid');

    const dashboardActions = (
        <>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <TrendingUp size={20} />
            </button>
        </>
    );

    return (
        <DashboardLayout
            title="Dashboard"
            actions={dashboardActions}
            currentPath="/"
        >
            <div className="max-w-7xl mx-auto">
                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                    {mockStats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        {stat.label}
                                    </p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {stat.value}
                                    </p>
                                </div>
                                <div
                                    className="p-3 rounded-lg"
                                    style={{ backgroundColor: '#FFE3EC' }}
                                >
                                    <stat.icon
                                        size={24}
                                        style={{ color: '#E213A7' }}
                                    />
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className="text-green-600 text-sm font-medium">
                                    {stat.change}
                                </span>
                                <span className="text-gray-600 text-sm ml-1">
                                    from last month
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main content grid */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Recent items - takes up more space on larger screens */}
                    <div className="xl:col-span-3">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Recent Items
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-2 rounded-lg transition-colors ${
                                                viewMode === 'grid'
                                                    ? 'bg-pink-100 text-pink-600'
                                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <Grid size={20} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-2 rounded-lg transition-colors ${
                                                viewMode === 'list'
                                                    ? 'bg-pink-100 text-pink-600'
                                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <List size={20} />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                                            <Filter size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <div
                                    className={
                                        viewMode === 'grid'
                                            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                                            : 'space-y-4'
                                    }
                                >
                                    {mockRecentItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                                                viewMode === 'list'
                                                    ? 'flex items-center space-x-4'
                                                    : ''
                                            }`}
                                        >
                                            <img
                                                src={
                                                    item.image ||
                                                    '/placeholder.svg'
                                                }
                                                alt={item.name}
                                                className={`rounded-lg object-cover ${
                                                    viewMode === 'list'
                                                        ? 'w-16 h-16 flex-shrink-0'
                                                        : 'w-full h-32 mb-3'
                                                }`}
                                            />
                                            <div
                                                className={
                                                    viewMode === 'list'
                                                        ? 'flex-1'
                                                        : ''
                                                }
                                            >
                                                <h4 className="font-medium text-gray-800 mb-1">
                                                    {item.name}
                                                </h4>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {item.category}
                                                </p>
                                                <div
                                                    className={`flex items-center justify-between ${
                                                        viewMode === 'list'
                                                            ? 'mt-1'
                                                            : 'mt-2'
                                                    }`}
                                                >
                                                    <span
                                                        className="font-semibold"
                                                        style={{
                                                            color: '#E213A7'
                                                        }}
                                                    >
                                                        {item.price}
                                                    </span>
                                                    <span
                                                        className={`text-xs px-2 py-1 rounded-full ${
                                                            item.status ===
                                                            'Available'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications and Quick Actions - smaller sidebar on large screens */}
                    <div className="xl:col-span-1 space-y-6">
                        {/* Notifications */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Recent Activity
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4 max-h-80 overflow-y-auto">
                                    {mockNotifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className="flex items-start space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                                style={{
                                                    backgroundColor: '#E213A7'
                                                }}
                                            ></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-800 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {notification.time}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Quick Actions
                                </h3>
                            </div>
                            <div className="p-6 space-y-3">
                                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center space-x-3">
                                        <Plus
                                            size={20}
                                            style={{ color: '#E213A7' }}
                                            className="group-hover:scale-110 transition-transform"
                                        />
                                        <span className="text-gray-800 font-medium">
                                            Add New Item
                                        </span>
                                    </div>
                                </button>
                                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center space-x-3">
                                        <TrendingUp
                                            size={20}
                                            style={{ color: '#E213A7' }}
                                            className="group-hover:scale-110 transition-transform"
                                        />
                                        <span className="text-gray-800 font-medium">
                                            View Analytics
                                        </span>
                                    </div>
                                </button>
                                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center space-x-3">
                                        <Package
                                            size={20}
                                            style={{ color: '#E213A7' }}
                                            className="group-hover:scale-110 transition-transform"
                                        />
                                        <span className="text-gray-800 font-medium">
                                            Manage Inventory
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
