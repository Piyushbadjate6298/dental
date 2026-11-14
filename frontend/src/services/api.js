// API Client for Shital Dental Services
export const RENDER_BACKEND_URL = 'https://dental-1-9jz8.onrender.com';

// Clean up any stale custom URL that might be stored in browser localStorage
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('shital_custom_api_url');
  } catch (e) {
    // Ignore storage errors
  }
}

let directFallbackActive = false;

export function getApiBaseUrl() {
  if (directFallbackActive) {
    return `${RENDER_BACKEND_URL}/api`;
  }
  const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (!raw) return '/api';
  return raw.endsWith('/api') ? raw : `${raw}/api`;
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
    const raw = (targetUrl || this.getBaseUrl()).trim().replace(/\/+$/, '');
    const base = raw.endsWith('/api') ? raw : `${raw}/api`;
    const res = await fetch(`${base}/health`, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`Server responded with HTTP ${res.status}`);
    }
    return await res.json();
  }

  async request(endpoint, options = {}) {
    const base = this.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${base}${cleanEndpoint}`;

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

    let response;
    let data = null;

    try {
      response = await fetch(url, config);

      // If static hosting returned 405 Method Not Allowed or 404 for an API route,
      // transparently retry directly against the deployed Render backend
      if ((response.status === 405 || response.status === 404) && !url.startsWith(RENDER_BACKEND_URL)) {
        console.warn(`[API] Static rewrite fallback on ${url} (${response.status}). Retrying directly with Render backend.`);
        url = `${RENDER_BACKEND_URL}/api${cleanEndpoint}`;
        response = await fetch(url, config);
        if (response.ok || response.status === 401 || response.status === 400 || response.status === 403) {
          directFallbackActive = true;
        }
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `HTTP error ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data?.data !== undefined ? data.data : data;
    } catch (err) {
      // If relative fetch failed completely (e.g. offline or DNS), try direct Render URL if not tried yet
      if (!url.startsWith(RENDER_BACKEND_URL) && err.name === 'TypeError' && err.message.includes('fetch')) {
        try {
          const directUrl = `${RENDER_BACKEND_URL}/api${cleanEndpoint}`;
          const retryRes = await fetch(directUrl, config);
          const ct = retryRes.headers.get('content-type');
          const retryData = ct && ct.includes('application/json') ? await retryRes.json() : { message: await retryRes.text() };
          if (retryRes.ok) {
            directFallbackActive = true;
            return retryData?.data !== undefined ? retryData.data : retryData;
          }
          if (retryRes.status === 401 || retryRes.status === 400 || retryRes.status === 403) {
            directFallbackActive = true;
            const msg = retryData?.error || retryData?.message || `HTTP error ${retryRes.status}`;
            const e = new Error(msg);
            e.status = retryRes.status;
            throw e;
          }
        } catch (retryErr) {
          if (retryErr.status) throw retryErr;
        }
      }

      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error(`Unable to connect to the dental laboratory server. Please check your internet connection.`);
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
