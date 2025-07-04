'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard-layout';
import api from '../lib/api';
import Image from 'next/image';
import {
    TrendingUp,
    Package,
    Heart,
    Star,
    Grid,
    List,
    Filter,
    Building2,
    ShoppingBag
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

// Mock data for dashboard
const mockStats = [
    { label: 'Total Items', value: '1,234', icon: Package, change: '+12%' },
    { label: 'Favorites', value: '89', icon: Heart, change: '+5%' },
    { label: 'Orders', value: '156', icon: ShoppingBag, change: '+23%' },
    { label: 'Reviews', value: '4.8', icon: Star, change: '+0.2' }
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
    const [recentProducts, setRecentProducts] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [salesTrends, setSalesTrends] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);
    const [loadingTrends, setLoadingTrends] = useState(true);

    useEffect(() => {
        const fetchRecentProducts = async () => {
            try {
                const response = await api.get('/products');
                let products = response.data.products || response.data || [];
                // Sort by created_at descending and take the latest 8
                products = products
                    .slice()
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 8);
                setRecentProducts(products);
            } catch (error) {
                // Optionally handle error
                setRecentProducts([]);
            }
        };
        fetchRecentProducts();
    }, []);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoadingAnalytics(true);
            try {
                const response = await api.get('/analytics/dashboard/overview');
                setAnalytics(response.data);
            } catch (error) {
                setAnalytics(null);
            } finally {
                setLoadingAnalytics(false);
            }
        };
        const fetchTrends = async () => {
            setLoadingTrends(true);
            try {
                const response = await api.get('/analytics/dashboard/sales-trends');
                setSalesTrends(response.data);
            } catch (error) {
                setSalesTrends(null);
            } finally {
                setLoadingTrends(false);
            }
        };
        fetchAnalytics();
        fetchTrends();
    }, []);

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
                    {loadingAnalytics || !analytics ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse h-32" />
                        ))
                    ) : (
                        <>
                            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Revenue (Today)</p>
                                        <p className="text-2xl font-bold text-gray-800">${analytics.total_revenue_today}</p>
                                    </div>
                                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#FFE3EC' }}>
                                        <TrendingUp size={24} style={{ color: '#E213A7' }} />
                                    </div>
                                </div>
                                <div className="mt-4 text-xs text-gray-500">This is your revenue for today.</div>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Orders (This Month)</p>
                                        <p className="text-2xl font-bold text-gray-800">{analytics.total_orders_month}</p>
                                    </div>
                                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#FFE3EC' }}>
                                        <ShoppingBag size={24} style={{ color: '#E213A7' }} />
                                    </div>
                                </div>
                                <div className="mt-4 text-xs text-gray-500">Orders placed this month.</div>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Customers</p>
                                        <p className="text-2xl font-bold text-gray-800">{analytics.total_customers}</p>
                                    </div>
                                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#FFE3EC' }}>
                                        <Heart size={24} style={{ color: '#E213A7' }} />
                                    </div>
                                </div>
                                <div className="mt-4 text-xs text-gray-500">Total registered customers.</div>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                                        <p className="text-2xl font-bold text-gray-800">${analytics.inventory_value}</p>
                                    </div>
                                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#FFE3EC' }}>
                                        <Package size={24} style={{ color: '#E213A7' }} />
                                    </div>
                                </div>
                                <div className="mt-4 text-xs text-gray-500">Total value of inventory.</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Sales Trends Graph */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Trends</h3>
                    {loadingTrends || !salesTrends ? (
                        <div className="h-48 flex items-center justify-center text-gray-400">Loading chart...</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={salesTrends.daily_sales.map(s => ({
                                ...s,
                                date: new Date(s.date).toLocaleDateString()
                            }))} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#E213A7" name="Revenue" />
                                <Line type="monotone" dataKey="orders" stroke="#8884d8" name="Orders" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
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
                                    {recentProducts.map((item) => (
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
                                                    item.thumbnail_url || item.primary_image_url || '/placeholder.svg?height=80&width=80'
                                                }
                                               
                                                alt={item.name}
                                                onError={(e) => {
                                                    e.target.style.display = "none"
                                                    e.target.nextSibling.style.display = "flex"
                                                  }}
                                                className={`rounded-lg object-cover ${
                                                    viewMode === 'list'
                                                        ? 'w-16 h-16 flex-shrink-0'
                                                        : 'w-full h-32 mb-3'
                                                }`}
                                            />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                <div className="text-sm text-gray-500 max-w-xs truncate">{item.description || 'No description'}</div>
                                                <div className="text-sm text-gray-500">{item.category.name || 'No category'}</div>
                                                <div className="text-sm text-gray-800 font-semibold">${item.base_price || item.price || 'N/A'}</div>
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
                                <span className='text-sm'>(Future work)</span>
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
                                        <a className='flex items-center space-x-3' href='/products'>
                                            <Building2
                                                size={20}
                                                style={{ color: '#E213A7' }}
                                                className="group-hover:scale-110 transition-transform"
                                            />
                                            <span className="text-gray-800 font-medium">
                                                Products
                                            </span>
                                        </a>
                                    </div>
                                </button>
                                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center space-x-3">
                                        <a href='/orders' className="flex items-center space-x-3">
                                        <ShoppingBag
                                            size={20}
                                            style={{ color: '#E213A7' }}
                                            className="group-hover:scale-110 transition-transform"
                                        />
                                        <span className="text-gray-800 font-medium">
                                            Orders Management
                                        </span>
                                        </a>
                                    </div>
                                </button>
                                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center space-x-3">
                                        <a href='/inventories' className="flex items-center space-x-3">
                                        <Package
                                            size={20}
                                            style={{ color: '#E213A7' }}
                                            className="group-hover:scale-110 transition-transform"
                                        />
                                        <span className="text-gray-800 font-medium">
                                            Manage Inventory
                                        </span>
                                        </a>
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
