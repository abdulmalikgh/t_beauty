'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard-layout';
import {
    Plus,
    Search,
    Users,
    Mail,
    UserCheck,
    Instagram,
    Edit,
    Trash2,
    Eye,
    ChevronLeft,
    ChevronRight,
    X,
    Star,
    Crown,
    AlertTriangle
} from 'lucide-react';

import api from '../../lib/api';
import handleApiError from '../../lib/handleApiError';

// API functions
const customersAPI = {
    getCustomers: async (params) => {
        try {
            const response = await api.get('/customers', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    addCustomer: async (customerData) => {
        try {
            const response = await api.post('/customers', customerData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateCustomer: async (customerId, customerData) => {
        try {
            const response = await api.put(
                `/customers/${customerId}`,
                customerData
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteCustomer: async (customerId) => {
        try {
            const response = await api.delete(`/customers/${customerId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    promoteToVip: async (customerId) => {
        try {
            const response = await api.post(
                `/customers/${customerId}/promote-vip`
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [customerToView, setCustomerToView] = useState(null);

    // Pagination and filters
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState('');
    const [isVipFilter, setIsVipFilter] = useState('');

    // Form data
    const initialFormData = {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        instagram_handle: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'Nigeria',
        is_vip: false,
        notes: '',
        preferred_contact_method: 'instagram'
    };

    const [formData, setFormData] = useState(initialFormData);

    // Calculate pagination
    const totalPages = Math.ceil(totalCustomers / pageSize);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalCustomers);

    // Fetch customers
    const fetchCustomers = async () => {
        setLoading(true);
        setError('');

        try {
            const params = {
                page: currentPage,
                size: pageSize
            };

            if (searchTerm) params.search = searchTerm;
            if (isActiveFilter !== '')
                params.is_active = isActiveFilter === 'true';
            if (isVipFilter !== '') params.is_vip = isVipFilter === 'true';

            const data = await customersAPI.getCustomers(params);
            setCustomers(data.customers || []);
            setTotalCustomers(data.total || 0);
        } catch (error) {
            const apiError = handleApiError(error);
            setError(apiError.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    // Open add modal
    const openAddModal = () => {
        setModalMode('add');
        setFormData(initialFormData);
        setSelectedCustomer(null);
        setShowModal(true);
    };

    // Open edit modal
    const openEditModal = (customer) => {
        setModalMode('edit');
        setSelectedCustomer(customer);
        setFormData({
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            instagram_handle: customer.instagram_handle || '',
            address_line1: customer.address_line1 || '',
            address_line2: customer.address_line2 || '',
            city: customer.city || '',
            state: customer.state || '',
            postal_code: customer.postal_code || '',
            country: customer.country || 'Nigeria',
            is_vip: customer.is_vip || false,
            notes: customer.notes || '',
            preferred_contact_method:
                customer.preferred_contact_method || 'instagram'
        });
        setShowModal(true);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (modalMode === 'add') {
                await customersAPI.addCustomer(formData);
            } else {
                await customersAPI.updateCustomer(
                    selectedCustomer.id,
                    formData
                );
            }

            setShowModal(false);
            setFormData(initialFormData);
            setSelectedCustomer(null);
            fetchCustomers(); // Refresh the list
        } catch (error) {
            const apiError = handleApiError(error);
            setError(apiError.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle delete customer
    const handleDeleteCustomer = async () => {
        if (!customerToDelete) return;

        setIsSubmitting(true);
        try {
            await customersAPI.deleteCustomer(customerToDelete.id);
            setShowDeleteModal(false);
            setCustomerToDelete(null);
            fetchCustomers(); // Refresh the list
        } catch (error) {
            const apiError = handleApiError(error);
            setError(apiError.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle promote to VIP
    const handlePromoteToVip = async (customer) => {
        try {
            await customersAPI.promoteToVip(customer.id);
            fetchCustomers(); // Refresh the list
        } catch (error) {
            const apiError = handleApiError(error);
            setError(apiError.message);
        }
    };

    // Handle view customer
    const handleViewCustomer = (customer) => {
        setCustomerToView(customer);
        setShowViewModal(true);
    };

    // Handle search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setCurrentPage(1); // Reset to first page when searching
            fetchCustomers();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, isActiveFilter, isVipFilter]);

    // Fetch customers on page/size change
    useEffect(() => {
        fetchCustomers();
    }, [currentPage, pageSize]);

    // Initial load
    useEffect(() => {
        fetchCustomers();
    }, []);

    const getStatusColor = (isVip) => {
        return isVip
            ? 'bg-purple-100 text-purple-800'
            : 'bg-green-100 text-green-800';
    };

    const getStatusIcon = (isVip) => {
        return isVip ? <Star size={16} /> : <UserCheck size={16} />;
    };

    return (
        <DashboardLayout
            title="Customers"
            subtitle="Manage your customer relationships"
            currentPath="/dashboard/customers"
        >
            <div className="max-w-7xl mx-auto">
                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg flex items-center justify-between">
                        <p>{error}</p>
                        <button
                            onClick={() => setError('')}
                            className="text-red-600 hover:text-red-800"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}
                <div className="w-full flex items-center justify-end mb-6">
                    <button
                        onClick={openAddModal}
                        className="flex items-center space-x-2 text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                        style={{ backgroundColor: '#E213A7' }}
                    >
                        <Plus size={20} />
                        <span>Add Customer</span>
                    </button>
                </div>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">
                                    Total Customers
                                </p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {totalCustomers}
                                </p>
                            </div>
                            <div
                                className="p-3 rounded-lg"
                                style={{ backgroundColor: '#FFE3EC' }}
                            >
                                <Users size={24} style={{ color: '#E213A7' }} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">
                                    VIP Customers
                                </p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {customers.filter((c) => c.is_vip).length}
                                </p>
                            </div>
                            <div
                                className="p-3 rounded-lg"
                                style={{ backgroundColor: '#FFE3EC' }}
                            >
                                <Star size={24} style={{ color: '#E213A7' }} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">
                                    This Page
                                </p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {customers.length}
                                </p>
                            </div>
                            <div
                                className="p-3 rounded-lg"
                                style={{ backgroundColor: '#FFE3EC' }}
                            >
                                <Users size={24} style={{ color: '#E213A7' }} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">
                                    Page {currentPage}
                                </p>
                                <p className="text-2xl font-bold text-gray-800">
                                    of {totalPages}
                                </p>
                            </div>
                            <div
                                className="p-3 rounded-lg"
                                style={{ backgroundColor: '#FFE3EC' }}
                            >
                                <Users size={24} style={{ color: '#E213A7' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                            <input
                                type="text"
                                placeholder="Search customers by name, email, or Instagram..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-4">
                            <select
                                value={isActiveFilter}
                                onChange={(e) =>
                                    setIsActiveFilter(e.target.value)
                                }
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                            >
                                <option value="">All Status</option>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>

                            <select
                                value={isVipFilter}
                                onChange={(e) => setIsVipFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                            >
                                <option value="">All Types</option>
                                <option value="true">VIP Only</option>
                                <option value="false">Regular Only</option>
                            </select>

                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                            >
                                <option value={10}>10 per page</option>
                                <option value={25}>25 per page</option>
                                <option value={50}>50 per page</option>
                                <option value={100}>100 per page</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Customers Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Customers ({startIndex}-{endIndex} of{' '}
                                {totalCustomers})
                            </h3>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div
                                className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                                style={{ borderColor: '#E213A7' }}
                            ></div>
                            <p className="text-gray-600">
                                Loading customers...
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Instagram
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Last Order
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {customers.map((customer) => (
                                            <tr
                                                key={customer.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                                                            <span className="text-pink-600 font-medium">
                                                                {
                                                                    customer
                                                                        .first_name?.[0]
                                                                }
                                                                {
                                                                    customer
                                                                        .last_name?.[0]
                                                                }
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {
                                                                    customer.first_name
                                                                }{' '}
                                                                {
                                                                    customer.last_name
                                                                }
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                ID:{' '}
                                                                {customer.id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 flex items-center mb-1">
                                                        <Mail
                                                            size={12}
                                                            className="mr-2"
                                                        />
                                                        {customer.email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {customer.instagram_handle ? (
                                                        <div className="text-sm text-gray-900 flex items-center">
                                                            <Instagram
                                                                size={12}
                                                                className="mr-2"
                                                            />
                                                            @
                                                            {
                                                                customer.instagram_handle
                                                            }
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">
                                                            Not provided
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                            customer.is_vip
                                                        )}`}
                                                    >
                                                        {getStatusIcon(
                                                            customer.is_vip
                                                        )}
                                                        <span className="ml-1">
                                                            {customer.is_vip
                                                                ? 'VIP'
                                                                : 'Regular'}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {customer.last_order_date
                                                        ? new Date(
                                                              customer.last_order_date
                                                          ).toLocaleDateString()
                                                        : 'No orders'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() =>
                                                                handleViewCustomer(
                                                                    customer
                                                                )
                                                            }
                                                            className="text-gray-400 hover:text-gray-600 p-1"
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                openEditModal(
                                                                    customer
                                                                )
                                                            }
                                                            className="text-gray-400 hover:text-blue-600 p-1"
                                                            title="Edit Customer"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        {!customer.is_vip && (
                                                            <button
                                                                onClick={() =>
                                                                    handlePromoteToVip(
                                                                        customer
                                                                    )
                                                                }
                                                                className="text-gray-400 hover:text-purple-600 p-1"
                                                                title="Promote to VIP"
                                                            >
                                                                <Crown
                                                                    size={16}
                                                                />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setCustomerToDelete(
                                                                    customer
                                                                );
                                                                setShowDeleteModal(
                                                                    true
                                                                );
                                                            }}
                                                            className="text-gray-400 hover:text-red-600 p-1"
                                                            title="Delete Customer"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Showing {startIndex} to {endIndex}{' '}
                                            of {totalCustomers} customers
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() =>
                                                    setCurrentPage(
                                                        Math.max(
                                                            1,
                                                            currentPage - 1
                                                        )
                                                    )
                                                }
                                                disabled={currentPage === 1}
                                                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>

                                            {/* Page numbers */}
                                            <div className="flex space-x-1">
                                                {Array.from(
                                                    {
                                                        length: Math.min(
                                                            5,
                                                            totalPages
                                                        )
                                                    },
                                                    (_, i) => {
                                                        let pageNum;
                                                        if (totalPages <= 5) {
                                                            pageNum = i + 1;
                                                        } else if (
                                                            currentPage <= 3
                                                        ) {
                                                            pageNum = i + 1;
                                                        } else if (
                                                            currentPage >=
                                                            totalPages - 2
                                                        ) {
                                                            pageNum =
                                                                totalPages -
                                                                4 +
                                                                i;
                                                        } else {
                                                            pageNum =
                                                                currentPage -
                                                                2 +
                                                                i;
                                                        }

                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() =>
                                                                    setCurrentPage(
                                                                        pageNum
                                                                    )
                                                                }
                                                                className={`px-3 py-1 rounded-lg text-sm ${
                                                                    currentPage ===
                                                                    pageNum
                                                                        ? 'text-white'
                                                                        : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                                                                }`}
                                                                style={
                                                                    currentPage ===
                                                                    pageNum
                                                                        ? {
                                                                              backgroundColor:
                                                                                  '#E213A7'
                                                                          }
                                                                        : {}
                                                                }
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    }
                                                )}
                                            </div>

                                            <button
                                                onClick={() =>
                                                    setCurrentPage(
                                                        Math.min(
                                                            totalPages,
                                                            currentPage + 1
                                                        )
                                                    )
                                                }
                                                disabled={
                                                    currentPage === totalPages
                                                }
                                                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {customers.length === 0 && !loading && (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 mb-4">
                                        <Users size={48} className="mx-auto" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                                        No customers found
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        {searchTerm ||
                                        isActiveFilter !== '' ||
                                        isVipFilter !== ''
                                            ? 'Try adjusting your search or filter criteria'
                                            : 'Get started by adding your first customer'}
                                    </p>
                                    <button
                                        onClick={openAddModal}
                                        className="text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                                        style={{ backgroundColor: '#E213A7' }}
                                    >
                                        Add Customer
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Add/Edit Customer Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {modalMode === 'add'
                                        ? 'Add New Customer'
                                        : 'Edit Customer'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Personal Information */}
                            <div>
                                <h4 className="text-md font-medium text-gray-800 mb-4">
                                    Personal Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            First Name{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.first_name}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'first_name',
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Last Name{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.last_name}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'last_name',
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div>
                                <h4 className="text-md font-medium text-gray-800 mb-4">
                                    Contact Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'email',
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'phone',
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Instagram Handle
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.instagram_handle}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'instagram_handle',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="@username"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Preferred Contact Method
                                        </label>
                                        <select
                                            value={
                                                formData.preferred_contact_method
                                            }
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'preferred_contact_method',
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                        >
                                            <option value="instagram">
                                                Instagram
                                            </option>
                                            <option value="email">Email</option>
                                            <option value="phone">Phone</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Address Information */}
                            <div>
                                <h4 className="text-md font-medium text-gray-800 mb-4">
                                    Address Information
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address Line 1
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address_line1}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'address_line1',
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address Line 2
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address_line2}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'address_line2',
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.city}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'city',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                State
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.state}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'state',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Postal Code
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.postal_code}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'postal_code',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Country
                                        </label>
                                        <select
                                            value={formData.country}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'country',
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                        >
                                            <option value="Nigeria">
                                                Nigeria
                                            </option>
                                            <option value="Ghana">Ghana</option>
                                            <option value="Kenya">Kenya</option>
                                            <option value="South Africa">
                                                South Africa
                                            </option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information */}
                            <div>
                                <h4 className="text-md font-medium text-gray-800 mb-4">
                                    Additional Information
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="is_vip"
                                            checked={formData.is_vip}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'is_vip',
                                                    e.target.checked
                                                )
                                            }
                                            className="w-4 h-4 text-pink-600 bg-white border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                                        />
                                        <label
                                            htmlFor="is_vip"
                                            className="ml-2 text-sm font-medium text-gray-700"
                                        >
                                            VIP Customer
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notes
                                        </label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'notes',
                                                    e.target.value
                                                )
                                            }
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                            placeholder="Any additional notes about this customer..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                    style={{ backgroundColor: '#E213A7' }}
                                >
                                    {isSubmitting
                                        ? modalMode === 'add'
                                            ? 'Adding...'
                                            : 'Updating...'
                                        : modalMode === 'add'
                                        ? 'Add Customer'
                                        : 'Update Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && customerToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="p-3 rounded-full bg-red-100 mr-4">
                                    <AlertTriangle
                                        size={24}
                                        className="text-red-600"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Delete Customer
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        This action cannot be undone
                                    </p>
                                </div>
                            </div>
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete{' '}
                                <span className="font-medium">
                                    {customerToDelete.first_name}{' '}
                                    {customerToDelete.last_name}
                                </span>
                                ? This will permanently remove their information
                                from your system.
                            </p>
                            <div className="flex items-center justify-end space-x-4">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setCustomerToDelete(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteCustomer}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting
                                        ? 'Deleting...'
                                        : 'Delete Customer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Customer Modal */}
            {showViewModal && customerToView && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Customer Details
                                </h3>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Customer Header */}
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center">
                                    <span className="text-pink-600 font-bold text-xl">
                                        {customerToView.first_name?.[0]}
                                        {customerToView.last_name?.[0]}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-xl font-semibold text-gray-800">
                                        {customerToView.first_name}{' '}
                                        {customerToView.last_name}
                                    </h4>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                customerToView.is_vip
                                            )}`}
                                        >
                                            {getStatusIcon(
                                                customerToView.is_vip
                                            )}
                                            <span className="ml-1">
                                                {customerToView.is_vip
                                                    ? 'VIP Customer'
                                                    : 'Regular Customer'}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div>
                                <h5 className="text-md font-medium text-gray-800 mb-3">
                                    Contact Information
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Mail
                                            size={16}
                                            className="text-gray-400"
                                        />
                                        <span className="text-gray-700">
                                            {customerToView.email}
                                        </span>
                                    </div>
                                    {customerToView.phone && (
                                        <div className="flex items-center space-x-2">
                                            <span className="text-gray-400">
                                                📞
                                            </span>
                                            <span className="text-gray-700">
                                                {customerToView.phone}
                                            </span>
                                        </div>
                                    )}
                                    {customerToView.instagram_handle && (
                                        <div className="flex items-center space-x-2">
                                            <Instagram
                                                size={16}
                                                className="text-gray-400"
                                            />
                                            <span className="text-gray-700">
                                                @
                                                {
                                                    customerToView.instagram_handle
                                                }
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-400">
                                            📧
                                        </span>
                                        <span className="text-gray-700 capitalize">
                                            {
                                                customerToView.preferred_contact_method
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Address Information */}
                            {(customerToView.address_line1 ||
                                customerToView.city ||
                                customerToView.state ||
                                customerToView.country) && (
                                <div>
                                    <h5 className="text-md font-medium text-gray-800 mb-3">
                                        Address
                                    </h5>
                                    <div className="text-gray-700">
                                        {customerToView.address_line1 && (
                                            <div>
                                                {customerToView.address_line1}
                                            </div>
                                        )}
                                        {customerToView.address_line2 && (
                                            <div>
                                                {customerToView.address_line2}
                                            </div>
                                        )}
                                        <div>
                                            {[
                                                customerToView.city,
                                                customerToView.state,
                                                customerToView.postal_code
                                            ]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </div>
                                        {customerToView.country && (
                                            <div>{customerToView.country}</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Order Information */}
                            <div>
                                <h5 className="text-md font-medium text-gray-800 mb-3">
                                    Order History
                                </h5>
                                <div className="text-gray-700">
                                    <p>
                                        Last Order:{' '}
                                        {customerToView.last_order_date
                                            ? new Date(
                                                  customerToView.last_order_date
                                              ).toLocaleDateString()
                                            : 'No orders yet'}
                                    </p>
                                </div>
                            </div>

                            {/* Notes */}
                            {customerToView.notes && (
                                <div>
                                    <h5 className="text-md font-medium text-gray-800 mb-3">
                                        Notes
                                    </h5>
                                    <div className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                        {customerToView.notes}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        openEditModal(customerToView);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Edit Customer
                                </button>
                                {!customerToView.is_vip && (
                                    <button
                                        onClick={() => {
                                            handlePromoteToVip(customerToView);
                                            setShowViewModal(false);
                                        }}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        Promote to VIP
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
