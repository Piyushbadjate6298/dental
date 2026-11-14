// API Client for Shital Dental Services

export function getApiBaseUrl() {
  const custom = typeof window !== 'undefined' ? localStorage.getItem('shital_custom_api_url') : null;
  const raw = (custom || import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (!raw) return '/api';
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

export function setCustomApiBaseUrl(url) {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      const clean = url.trim().replace(/\/+$/, '');
      const formatted = clean.endsWith('/api') ? clean : `${clean}/api`;
      localStorage.setItem('shital_custom_api_url', formatted);
      return formatted;
    } else {
      localStorage.removeItem('shital_custom_api_url');
      return getApiBaseUrl();
    }
  }
  return '/api';
}

class ApiClient {
  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem('shital_auth_token') || null : null;
  }

  getBaseUrl() {
    return getApiBaseUrl();
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('shital_auth_token', token);
      } else {
        localStorage.removeItem('shital_auth_token');
      }
    }
  }

  async testConnection(targetUrl) {
    const raw = (targetUrl || getApiBaseUrl()).trim().replace(/\/+$/, '');
    const base = raw.endsWith('/api') ? raw : `${raw}/api`;
    const res = await fetch(`${base}/health`, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`Server responded with HTTP ${res.status}`);
    }
    return await res.json();
  }

  async request(endpoint, options = {}) {
    const base = getApiBaseUrl();
    const url = `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
      credentials: 'include', // Includes HttpOnly cookies
    };

    try {
      const response = await fetch(url, config);
      let data = null;

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        if (response.status === 405) {
          throw new Error(
            `HTTP 405 (Method Not Allowed): The request was sent to "${url}". Vercel static hosting received this POST request instead of your Render backend. Please configure your Render backend URL below.`
          );
        }
        const errorMessage = data?.error || data?.message || `HTTP error ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data?.data !== undefined ? data.data : data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error(`Could not connect to backend at "${url}". Please check your internet connection or verify your Render backend URL.`);
      }
      throw err;
    }
  }

  // --- Auth APIs ---
  async login(username, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res?.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  async changePassword(currentPassword, newPassword) {
    return await this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // --- Doctor APIs ---
  async getDoctors(activeOnly = false) {
    return await this.request(`/doctors?active_only=${activeOnly}`);
  }

  async addDoctor(doctor_name) {
    return await this.request('/doctors', {
      method: 'POST',
      body: JSON.stringify({ doctor_name }),
    });
  }

  async updateDoctor(id, doctor_name, is_active = true) {
    return await this.request(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ doctor_name, is_active }),
    });
  }

  async deleteDoctor(id) {
    return await this.request(`/doctors/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Inquiry APIs ---
  async getInquiries(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'All') query.set('status', params.status);
    if (params.doctorId) query.set('doctorId', params.doctorId);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.page) query.set('page', params.page);
    if (params.limit !== undefined) query.set('limit', params.limit);

    const qs = query.toString();
    const endpoint = `/inquiries${qs ? `?${qs}` : ''}`;
    return await this.request(endpoint);
  }

  async getInquiryById(id) {
    return await this.request(`/inquiries/${id}`);
  }

  async createInquiry(payload) {
    return await this.request('/inquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateInquiry(id, payload) {
    return await this.request(`/inquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteInquiry(id) {
    return await this.request(`/inquiries/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Settings APIs ---
  async getSettings() {
    return await this.request('/settings');
  }

  async updateSettings(payload) {
    return await this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async getInquiryFormSettings() {
    return await this.request('/settings/inquiry-form');
  }

  async updateInquiryFormSettings(payload) {
    return await this.request('/settings/inquiry-form', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // --- Dashboard APIs ---
  async getDashboardStats() {
    return await this.request('/dashboard/stats');
  }

  // --- Migration APIs ---
  async importLocalData(data) {
    return await this.request('/migrate/import-local', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Healthcheck ---
  async getHealth() {
    return await this.request('/health');
  }
}

export const api = new ApiClient();
export default api;
