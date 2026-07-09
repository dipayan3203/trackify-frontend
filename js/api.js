// ============================================
// API Module - Handles all backend communication
// ============================================

class TrackifyAPI {
    constructor(baseURL = '', apiKey = '') {
        this.baseURL = baseURL.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.timeout = 10000; // 10 seconds
    }

    setBaseURL(url) {
        this.baseURL = url.replace(/\/$/, '');
    }

    setApiKey(key) {
        this.apiKey = key;
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        if (!this.baseURL) {
            throw new Error('API base URL not configured. Please set it in Settings.');
        }

        const url = `${this.baseURL}${endpoint}`;
        const startTime = performance.now();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.getHeaders(),
                    ...options.headers,
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const latency = Math.round(performance.now() - startTime);

            if (response.status === 204) {
                return { data: null, latency, status: 204 };
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message = data.detail || data.message || `HTTP ${response.status}`;
                throw new Error(message);
            }

            return { data, latency, status: response.status };
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Request timeout - server may be slow to respond');
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error - unable to reach server. Check your API URL.');
            }

            throw error;
        }
    }

    // ============ Jobs ============
    async getJobs(limit = 100) {
        const response = await this.request(`/jobs/?limit=${limit}`);
        return response.data || [];
    }

    async getJob(id) {
        const response = await this.request(`/jobs/${id}`);
        return response.data;
    }

    async createJob(jobData) {
        const response = await this.request('/jobs/', {
            method: 'POST',
            body: JSON.stringify(jobData),
        });
        return response.data;
    }

    async updateJobStatus(id, status) {
        const response = await this.request(`/jobs/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
        return response.data;
    }

    // ============ Notes ============
    async getNotes(jobId) {
        const response = await this.request(`/jobs/${jobId}/notes`);
        return response.data || [];
    }

    async addNote(jobId, note) {
        const response = await this.request(`/jobs/${jobId}/notes`, {
            method: 'POST',
            body: JSON.stringify({ note }),
        });
        return response.data;
    }

    // ============ Matches ============
    async getMatches() {
        const response = await this.request('/matches/');
        return response.data || [];
    }

    // ============ Resume ============
    async getResumeStatus() {
        const response = await this.request('/resume/status');
        return response.data || {};
    }

    async uploadResume(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await this.request('/resume/upload', {
            method: 'POST',
            body: formData,
            headers: {
                // Remove Content-Type for FormData
            },
        });
        return response.data;
    }

    // ============ Health ============
    async health() {
        const response = await this.request('/health');
        return response.data;
    }
}

// Singleton instance
let apiInstance = null;

function getAPI() {
    if (!apiInstance) {
        const base = localStorage.getItem('trackify_api_base') || '';
        const key = localStorage.getItem('trackify_api_key') || '';
        apiInstance = new TrackifyAPI(base, key);
    }
    return apiInstance;
}

window.TrackifyAPI = TrackifyAPI;
window.getAPI = getAPI;
