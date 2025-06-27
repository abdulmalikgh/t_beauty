import axios from 'axios';

const api = axios.create({
    baseURL:
        process.env.NEXT_PUBLIC_API_URL ||
        'https://t-beauty.onrender.com/api/v1/',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(
                '🚀 API Request:',
                config.method?.toUpperCase(),
                config.url
            );
        }

        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(
                '✅ API Response:',
                response.status,
                response.config.url
            );
        }

        return response;
    },
    (error) => {
        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    localStorage.removeItem('authToken');
                    if (typeof window !== 'undefined') {
                        window.location.href = '/auth/login';
                    }
                    break;
                case 403:
                    console.error('❌ Forbidden: You do not have permission');
                    break;
                case 404:
                    console.error('❌ Not Found: Resource does not exist');
                    break;
                case 500:
                    console.error('❌ Server Error: Something went wrong');
                    break;
                default:
                    console.error(
                        `❌ API Error (${status}):`,
                        data?.message || error.message
                    );
            }
        } else if (error.request) {
            console.error('❌ Network Error: No response received');
        } else {
            console.error('❌ Request Setup Error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;
