const BASE_URL = '/api/v1';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('accessToken');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('accessToken', token);
        } else {
            localStorage.removeItem('accessToken');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
            ...options.headers,
        };

        const config = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
                    // Logic for refresh token could go here. For now, we'll just clear and rely on context to logout.
                    // This is handled better by an interceptor, but we'll keep fetch simple.
                    const error = new Error(data?.error?.message || 'Unauthorized');
                    error.status = 401;
                    throw error;
                }
                throw new Error(data?.error?.message || data?.error?.[0]?.message || 'API Error');
            }

            return data.data; // Assuming standardized response format { success: true, data: { ... } }
        } catch (error) {
            console.error(`API Request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
    }

    patch(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

export const api = new ApiClient();
