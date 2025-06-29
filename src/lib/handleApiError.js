const handleApiError = (error) => {
    if (error.response) {
        const { status, data } = error.response;

        if (status === 422 && data.detail) {
            // Handle validation errors
            const validationErrors = data.detail
                .map((error) => {
                    return `${error.loc[1]} is ${error.msg}`;
                })
                .join(', ');
            return {
                status: 422,
                message:
                    validationErrors ||
                    'Validation failed. Please check your input.'
            };
        }

        if (status === 404) {
            return data.detail;
        }
        // Handle other status codes
        switch (status) {
            case 409:
                return {
                    status: 409,
                    message:
                        'Email already exists. Please use a different email.'
                };
            case 400:
                return {
                    status: 400,
                    message:
                        data.message || data.detail ||
                        'Invalid request. Please check your input.'
                };
            default:
                return {
                    status: status,
                    message:
                        data.message || 'An error occurred. Please try again.'
                };
        }
    } else if (error.request) {
        return {
            status: 500,
            message: 'No response from server. Please try again later.'
        };
    } else {
        return {
            status: 500,
            message: error.message || 'An unexpected error occurred'
        };
    }
};

export default handleApiError;
